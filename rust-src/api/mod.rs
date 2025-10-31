pub mod objects;
pub mod validation;
pub mod traits;
pub mod interpolation;

pub mod documentation;
pub mod methods;
pub mod properties;
pub mod types;

pub use objects::app::ApiObject;
pub use crate::validation::rules::ValidationRule;
pub use crate::validation::rules::MethodValidation;
pub use properties::PropertyValidation;
pub use types::*;

use std::collections::{HashMap, HashSet};
use serde_json::Value;
use itertools::Itertools;

use crate::data::match_names::{get_effect_match_names, get_layer_match_names, get_property_match_names};
use crate::validation::context::{ValidationContext, ObjectContext};
use crate::validation::rules::PropertyValueType;
use crate::validation::property::validate_property_value;

pub struct UnifiedApi {
    pub objects: HashMap<String, ApiObject>,
    global_functions: HashSet<String>,
    effect_match_names: HashSet<String>,
    layer_match_names: HashSet<String>,
    property_match_names: HashSet<String>,
    validation_context: ValidationContext,
}

impl UnifiedApi {
    pub fn new() -> Self {
        let mut api = UnifiedApi {
            objects: HashMap::new(),
            global_functions: HashSet::new(),
            effect_match_names: get_effect_match_names().into_iter().map(String::from).collect(),
            layer_match_names: get_layer_match_names().into_iter().map(String::from).collect(),
            property_match_names: get_property_match_names().into_iter().map(String::from).collect(),
            validation_context: ValidationContext::new(),
        };

        api.initialize_core_api();
        api.initialize_effect_match_names();
        api.initialize_layer_match_names();
        api.initialize_property_match_names();

        api
    }

    pub fn validate_method(&self, class_name: &str, method_name: &str) -> bool {
        if let Some(obj) = self.objects.get(class_name) {
            obj.methods.contains_key(method_name)
        } else {
            false
        }
    }

    pub fn validate_property(&self, class_name: &str, property_name: &str) -> bool {
        if let Some(obj) = self.objects.get(class_name) {
            obj.properties.contains_key(property_name)
        } else {
            false
        }
    }

    pub fn validate_property_access(&mut self, class_name: &str, property_name: &str, value: Option<&Value>) -> Result<(), String> {
        if let Some(api_obj) = self.objects.get(class_name) {
            // Enter the object's context for validation
            self.validation_context.enter_context(api_obj.object_type.clone());
            
            let result = if let Some(rule) = api_obj.properties.get(property_name) {
                if let Some(val) = value {
                    // If we're setting a value, validate it
                    validate_property_value(val, rule)
                } else {
                    // If we're just accessing the property, that's fine
                    Ok(())
                }
            } else {
                Err(format!("Property {} not found on {}", property_name, class_name))
            };

            // Exit the context after validation
            self.validation_context.exit_context();
            result
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    pub fn validate_effect_match_name(&self, match_name: &str) -> bool {
        self.effect_match_names.contains(match_name)
    }

    pub fn validate_layer_match_name(&self, match_name: &str) -> bool {
        self.layer_match_names.contains(match_name)
    }

    pub fn validate_property_match_name(&self, match_name: &str) -> bool {
        self.property_match_names.contains(match_name)
    }

    pub fn suggest_effect_match_name(&self, match_name: &str) -> Option<String> {
        self.fuzzy_match_suggestions(&self.effect_match_names, match_name, "effect")
    }

    pub fn suggest_layer_match_name(&self, match_name: &str) -> Option<String> {
        self.fuzzy_match_suggestions(&self.layer_match_names, match_name, "layer")
    }

    pub fn suggest_property_match_name(&self, match_name: &str) -> Option<String> {
        self.fuzzy_match_suggestions(&self.property_match_names, match_name, "property")
    }

    fn fuzzy_match_suggestions(&self, match_names: &HashSet<String>, input: &str, category: &str) -> Option<String> {
        let mut similar_matches: Vec<(usize, &String)> = match_names.iter()
            .map(|name| (strsim::levenshtein(input, name), name))
            .filter(|(distance, _)| *distance <= 8) // Allow more distance for longer match names
            .collect();

        similar_matches.sort_by_key(|(distance, _)| *distance);

        if !similar_matches.is_empty() {
            let suggestions: Vec<&String> = similar_matches.iter()
                .take(5) // Show top 5 suggestions
                .map(|(_, name)| *name)
                .collect();

            Some(format!(
                "Invalid {} match name: '{}'\n\nDid you mean one of these?\n{}",
                category,
                input,
                suggestions.iter().join("\n")
            ))
        } else {
            None
        }
    }

    pub fn validate_method_call(&mut self, class_name: &str, method_name: &str, args: &[Value]) -> Result<(), String> {
        if let Some(api_obj) = self.objects.get(class_name) {
            // Enter the object's context for validation
            self.validation_context.enter_context(api_obj.object_type.clone());
            
            let result = if let Some(method) = api_obj.methods.get(method_name) {
                // Validate method arguments
                if args.len() != method.param_count {
                    Err(format!(
                        "Method {} expects {} arguments, got {}",
                        method_name,
                        method.param_count,
                        args.len()
                    ))
                } else {
                    // Validate each argument with context
                    for (i, _arg) in args.iter().enumerate() {
                        if i < method.param_types.len() {
                            // Basic type validation would go here
                            // For now, just validate that the argument exists
                        }
                    }
                    Ok(())
                }
            } else {
                Err(format!("Method {} not found on {}", method_name, class_name))
            };

            // Exit the context after validation
            self.validation_context.exit_context();
            result
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    pub fn validate_property_value(&self, class_name: &str, property_name: &str, value: &Value, _context: &ValidationContext) -> Result<(), String> {
        let obj = self.objects.get(class_name)
            .ok_or_else(|| format!("Unknown class: {}", class_name))?;
        
        let prop = obj.properties.get(property_name)
            .ok_or_else(|| format!("Unknown property: {}", property_name))?;

        // Check if this is an alternate source property
        if property_name == "alternateSource" {
            return obj.validate_alternate_source(value);
        }

        // Basic property validation using the validation rule
        prop.validate(value)
    }

    fn initialize_core_api(&mut self) {
        // Application object
        let mut app = ApiObject::new(ObjectContext::App);
        
        // App methods based on After Effects documentation
        app.methods.insert("beginUndoGroup".to_string(), MethodValidation::new(1));
        app.methods.insert("endUndoGroup".to_string(), MethodValidation::new(0));
        app.methods.insert("newProject".to_string(), MethodValidation::new(0));
        app.methods.insert("open".to_string(), MethodValidation::new(1));
        app.methods.insert("quit".to_string(), MethodValidation::new(0));
        app.methods.insert("purge".to_string(), MethodValidation::new(1));
        app.methods.insert("beginSuppressDialogs".to_string(), MethodValidation::new(0));
        app.methods.insert("endSuppressDialogs".to_string(), MethodValidation::new(1));
        app.methods.insert("executeCommand".to_string(), MethodValidation::new(1));
        app.methods.insert("findMenuCommandId".to_string(), MethodValidation::new(1));
        app.methods.insert("getPrefsValue".to_string(), MethodValidation::new(2));
        app.methods.insert("setPrefsValue".to_string(), MethodValidation::new(3));
        app.methods.insert("savePrefsAs".to_string(), MethodValidation::new(1));
        app.methods.insert("loadPrefsFromFile".to_string(), MethodValidation::new(1));
        app.methods.insert("watchFolder".to_string(), MethodValidation::new(1));
        app.methods.insert("cancelWatchFolder".to_string(), MethodValidation::new(0));
        app.methods.insert("pauseWatchFolder".to_string(), MethodValidation::new(1));
        
        // App properties
        app.properties.insert("project".to_string(), ValidationRule::simple(PropertyValueType::Custom("Project".to_string())));
        app.properties.insert("version".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        app.properties.insert("buildName".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        app.properties.insert("buildNumber".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        app.properties.insert("effects".to_string(), ValidationRule::simple(PropertyValueType::Custom("Array".to_string())));
        app.properties.insert("fonts".to_string(), ValidationRule::simple(PropertyValueType::Custom("Object".to_string())));
        app.properties.insert("activeViewer".to_string(), ValidationRule::simple(PropertyValueType::Custom("Viewer".to_string())));
        app.properties.insert("disableRendering".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        app.properties.insert("exitAfterLaunchAndEval".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        app.properties.insert("exitCode".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        app.properties.insert("availableGPUAccelTypes".to_string(), ValidationRule::simple(PropertyValueType::Custom("Array".to_string())));

        self.objects.insert("app".to_string(), app.clone());
        self.objects.insert("Application".to_string(), app);

        // Project object
        let mut project = ApiObject::new(ObjectContext::Project);
        
        // Project methods
        project.methods.insert("save".to_string(), MethodValidation::new(0));
        project.methods.insert("saveWithDialog".to_string(), MethodValidation::new(0));
        project.methods.insert("close".to_string(), MethodValidation::new(1));
        project.methods.insert("item".to_string(), MethodValidation::new(1));
        project.methods.insert("importFile".to_string(), MethodValidation::new(1));
        project.methods.insert("importFileWithDialog".to_string(), MethodValidation::new(0));
        project.methods.insert("importPlaceholder".to_string(), MethodValidation::new(5));
        project.methods.insert("consolidateFootage".to_string(), MethodValidation::new(0));
        project.methods.insert("removeUnusedFootage".to_string(), MethodValidation::new(0));
        project.methods.insert("reduceProject".to_string(), MethodValidation::new(1));
        project.methods.insert("showWindow".to_string(), MethodValidation::new(1));
        project.methods.insert("autoFixExpressions".to_string(), MethodValidation::new(2));
        
        // Project properties
        project.properties.insert("file".to_string(), ValidationRule::simple(PropertyValueType::Custom("File".to_string())));
        project.properties.insert("rootFolder".to_string(), ValidationRule::simple(PropertyValueType::Custom("FolderItem".to_string())));
        project.properties.insert("activeItem".to_string(), ValidationRule::simple(PropertyValueType::Custom("Item".to_string())));
        project.properties.insert("numItems".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.0, f64::MAX));
        project.properties.insert("items".to_string(), ValidationRule::simple(PropertyValueType::Custom("ItemCollection".to_string())));
        project.properties.insert("renderQueue".to_string(), ValidationRule::simple(PropertyValueType::Custom("RenderQueue".to_string())));
        project.properties.insert("dirty".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        project.properties.insert("bitsPerChannel".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        project.properties.insert("transparencyGridThumbnails".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        project.properties.insert("workingSpace".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        project.properties.insert("workingGamma".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        project.properties.insert("linearizeWorkingSpace".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        project.properties.insert("compensateForSceneReferredProfiles".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        project.properties.insert("gpuAccelType".to_string(), ValidationRule::simple(PropertyValueType::Custom("GpuAccelType".to_string())));
        project.properties.insert("expressionEngine".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        project.properties.insert("feetFramesFilmType".to_string(), ValidationRule::simple(PropertyValueType::Custom("FeetFramesFilmType".to_string())));
        project.properties.insert("framesCountType".to_string(), ValidationRule::simple(PropertyValueType::Custom("FramesCountType".to_string())));
        project.properties.insert("framesUseFeetFrames".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        project.properties.insert("displayStartFrame".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        project.properties.insert("timeDisplayType".to_string(), ValidationRule::simple(PropertyValueType::Custom("TimeDisplayType".to_string())));

        self.objects.insert("project".to_string(), project.clone());
        self.objects.insert("Project".to_string(), project);

        // Item object (base class)
        let mut item = ApiObject::new(ObjectContext::Item);
        
        // Item methods
        item.methods.insert("remove".to_string(), MethodValidation::new(0));
        item.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        
        // Item properties
        item.properties.insert("name".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        item.properties.insert("id".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(1.0, f64::MAX));
        item.properties.insert("parentFolder".to_string(), ValidationRule::simple(PropertyValueType::Custom("FolderItem".to_string())));
        item.properties.insert("selected".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        item.properties.insert("typeName".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        item.properties.insert("comment".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        item.properties.insert("label".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.0, 16.0));

        self.objects.insert("Item".to_string(), item.clone());
        self.objects.insert("item".to_string(), item);

        // CompItem object
        let mut comp_item = ApiObject::new(ObjectContext::Comp);
        
        // CompItem methods
        comp_item.methods.insert("layer".to_string(), MethodValidation::new(1));
        comp_item.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        comp_item.methods.insert("openInViewer".to_string(), MethodValidation::new(0));
        comp_item.methods.insert("saveFrameToPng".to_string(), MethodValidation::new(2));
        
        // CompItem properties
        comp_item.properties.insert("width".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(4.0, 30000.0));
        comp_item.properties.insert("height".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(4.0, 30000.0));
        comp_item.properties.insert("duration".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.0, f64::MAX));
        comp_item.properties.insert("frameRate".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.01, 99.0));
        comp_item.properties.insert("pixelAspect".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.01, 99.0));
        comp_item.properties.insert("layers".to_string(), ValidationRule::simple(PropertyValueType::Custom("LayerCollection".to_string())));
        comp_item.properties.insert("numLayers".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        comp_item.properties.insert("activeCamera".to_string(), ValidationRule::simple(PropertyValueType::Custom("CameraLayer".to_string())));
        comp_item.properties.insert("bgColor".to_string(), ValidationRule::simple(PropertyValueType::Custom("Color".to_string())));
        comp_item.properties.insert("shutterAngle".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        comp_item.properties.insert("shutterPhase".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        comp_item.properties.insert("motionBlur".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        comp_item.properties.insert("draft3d".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        comp_item.properties.insert("frameBlending".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        comp_item.properties.insert("preserveNestedFrameRate".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        comp_item.properties.insert("preserveNestedResolution".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        comp_item.properties.insert("resolutionFactor".to_string(), ValidationRule::simple(PropertyValueType::Custom("TwoD".to_string())));
        comp_item.properties.insert("workAreaStart".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        comp_item.properties.insert("workAreaDuration".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));

        self.objects.insert("CompItem".to_string(), comp_item.clone());
        self.objects.insert("compItem".to_string(), comp_item);

        // Layer object (base layer)
        let mut layer = ApiObject::new(ObjectContext::Layer);
        
        // Layer methods
        layer.methods.insert("property".to_string(), MethodValidation::new(1));
        layer.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        layer.methods.insert("copyToComp".to_string(), MethodValidation::new(1));
        layer.methods.insert("moveToBeginning".to_string(), MethodValidation::new(0));
        layer.methods.insert("moveToEnd".to_string(), MethodValidation::new(0));
        layer.methods.insert("moveAfter".to_string(), MethodValidation::new(1));
        layer.methods.insert("moveBefore".to_string(), MethodValidation::new(1));
        layer.methods.insert("remove".to_string(), MethodValidation::new(0));
        layer.methods.insert("applyPreset".to_string(), MethodValidation::new(1));
        layer.methods.insert("openInViewer".to_string(), MethodValidation::new(0));
        
        // Layer properties
        layer.properties.insert("name".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        layer.properties.insert("index".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("enabled".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("locked".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("shy".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("solo".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("threeDLayer".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("motionBlur".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("adjustmentLayer".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("guide".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("label".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())).with_range(0.0, 16.0));
        layer.properties.insert("blendingMode".to_string(), ValidationRule::simple(PropertyValueType::Custom("BlendingMode".to_string())));
        layer.properties.insert("quality".to_string(), ValidationRule::simple(PropertyValueType::Custom("LayerQuality".to_string())));
        layer.properties.insert("parent".to_string(), ValidationRule::simple(PropertyValueType::Custom("Layer".to_string())));
        layer.properties.insert("inPoint".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("outPoint".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("startTime".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("stretch".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("width".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("height".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        layer.properties.insert("containingComp".to_string(), ValidationRule::simple(PropertyValueType::Custom("CompItem".to_string())));
        layer.properties.insert("isNameSet".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        layer.properties.insert("comment".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));

        self.objects.insert("Layer".to_string(), layer.clone());
        self.objects.insert("layer".to_string(), layer);

        // Property object
        let mut property = ApiObject::new(ObjectContext::Property("".to_string()));
        
        // Property methods
        property.methods.insert("setValue".to_string(), MethodValidation::new(1));
        property.methods.insert("setValueAtTime".to_string(), MethodValidation::new(2));
        property.methods.insert("setValueAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("valueAtTime".to_string(), MethodValidation::new(2));
        property.methods.insert("velocityAtTime".to_string(), MethodValidation::new(2));
        property.methods.insert("speedAtTime".to_string(), MethodValidation::new(1));
        property.methods.insert("keyTime".to_string(), MethodValidation::new(1));
        property.methods.insert("keyValue".to_string(), MethodValidation::new(1));
        property.methods.insert("addKey".to_string(), MethodValidation::new(1));
        property.methods.insert("removeKey".to_string(), MethodValidation::new(1));
        property.methods.insert("nearestKeyIndex".to_string(), MethodValidation::new(1));
        property.methods.insert("setInterpolationTypeAtKey".to_string(), MethodValidation::new(3));
        property.methods.insert("setTemporalEaseAtKey".to_string(), MethodValidation::new(3));
        property.methods.insert("setTemporalContinuousAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("setTemporalAutoBezierAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("setSpatialTangentsAtKey".to_string(), MethodValidation::new(3));
        property.methods.insert("setSpatialContinuousAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("setSpatialAutoBezierAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("setRovingAtKey".to_string(), MethodValidation::new(2));
        property.methods.insert("setSelectedAtKey".to_string(), MethodValidation::new(2));
        
        // Property properties
        property.properties.insert("value".to_string(), ValidationRule::simple(PropertyValueType::Custom("Any".to_string())));
        property.properties.insert("hasMin".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("hasMax".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("minValue".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        property.properties.insert("maxValue".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        property.properties.insert("isTimeVarying".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("numKeys".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        property.properties.insert("propertyIndex".to_string(), ValidationRule::simple(PropertyValueType::Custom("Number".to_string())));
        property.properties.insert("propertyType".to_string(), ValidationRule::simple(PropertyValueType::Custom("PropertyType".to_string())));
        property.properties.insert("propertyValueType".to_string(), ValidationRule::simple(PropertyValueType::Custom("PropertyValueType".to_string())));
        property.properties.insert("unitsText".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        property.properties.insert("expression".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        property.properties.insert("expressionEnabled".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("expressionError".to_string(), ValidationRule::simple(PropertyValueType::Custom("String".to_string())));
        property.properties.insert("canSetExpression".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("dimensionsSeparated".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("isSeparationFollower".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));
        property.properties.insert("isSeparationLeader".to_string(), ValidationRule::simple(PropertyValueType::Custom("Boolean".to_string())));

        self.objects.insert("Property".to_string(), property.clone());
        self.objects.insert("property".to_string(), property);
    }

    fn initialize_effect_match_names(&mut self) {
        // Based on the After Effects documentation, add comprehensive effect match names
        let effect_names = vec![
            // 3D Channel Effects
            "ADBE AUX CHANNEL EXTRACT", "ADBE DEPTH MATTE", "ADBE DEPTH FIELD", "EXtractoR", 
            "ADBE FOG_3D", "ADBE ID MATTE", "IDentifier",
            
            // Audio Effects
            "ADBE Aud Reverse", "ADBE Aud BT", "ADBE Aud Delay", "ADBE Aud_Flange", 
            "ADBE Aud HiLo", "ADBE Aud Modulator", "ADBE Param EQ", "ADBE Aud Reverb", 
            "ADBE Aud Stereo Mixer", "ADBE Aud Tone",
            
            // Blur & Sharpen Effects
            "ADBE Bilateral", "ADBE Camera Lens Blur", "ADBE CameraShakeDeblur", "CS CrossBlur",
            "CC Radial Blur", "CC Radial Fast Blur", "CC Vector Blur", "ADBE Channel Blur",
            "ADBE Compound Blur", "ADBE Motion Blur", "ADBE Box Blur2", "ADBE Gaussian Blur 2",
            "ADBE Radial Blur", "ADBE Sharpen", "ADBE Smart Blur", "ADBE Unsharp Mask2",
            
            // Channel Effects
            "ADBE Arithmetic", "ADBE Blend", "ADBE Calculations", "CC Composite",
            "ADBE Channel Combiner", "ADBE Compound Arithmetic", "ADBE Invert", "ADBE Minimax",
            "ADBE Remove Color Matting", "ADBE Set Channels", "ADBE Set Matte3", "ADBE Shift Channels",
            "ADBE Solid Composite",
            
            // Color Correction Effects
            "ADBE AutoColor", "ADBE AutoContrast", "ADBE AutoLevels", "ADBE Black&White",
            "ADBE Brightness & Contrast 2", "ADBE Broadcast Colors", "CS Color Neutralizer",
            "CC Color Offset", "CS Kernel", "CC Toner", "ADBE Change Color", "ADBE Change To Color",
            "ADBE CHANNEL MIXER", "ADBE Color Balance 2", "ADBE Color Balance (HLS)",
            "ADBE Color Link", "ADBE Deflicker", "APC Colorama", "ADBE CurvesCustom",
            "ADBE Equalize", "ADBE Exposure2", "ADBE Gamma/Pedestal/Gain2", "ADBE HUE SATURATION",
            "ADBE Leave Color", "ADBE Easy Levels2", "ADBE Pro Levels2", "ADBE Lumetri",
            "ADBE PhotoFilterPS", "ADBE PS Arbitrary Map", "ADBE SelectiveColor",
            "ADBE ShadowHighlight", "ADBE Tint", "ADBE Tritone", "ADBE Vibrance",
            
            // Distort Effects
            "ADBE BEZMESH", "ADBE Bulge", "CC Bend It", "CC Bender", "CC Blobbylize",
            "CC Flo Motion", "CC Griddler", "CC Lens", "CC Page Turn", "CC Power Pin",
            "CC Ripple Pulse", "CC Slant", "CC Smear", "CC Split", "CC Split 2", "CC Tiler",
            "ADBE Corner Pin", "ADBE Upscale", "ADBE Displacement Map", "ADBE LIQUIFY",
            "ADBE Magnify", "ADBE MESH WARP", "ADBE Mirror", "ADBE Offset",
            "ADBE Optics Compensation", "ADBE Polar Coordinates", "ADBE RESHAPE", "ADBE Ripple",
            "ADBE Rolling Shutter", "ADBE SCHMEAR", "ADBE Spherize", "ADBE Geometry2",
            "ADBE Turbulent Displace", "ADBE Twirl", "ADBE WRPMESH", "ADBE SubspaceStabilizer",
            "ADBE Wave Warp",
            
            // Expression Controls
            "ADBE Point3D Control", "ADBE Angle Control", "ADBE Checkbox Control", "ADBE Color Control",
            "ADBE Dropdown Control", "ADBE Layer Control", "ADBE Point Control", "ADBE Slider Control",
            
            // Generate Effects
            "ADBE 4ColorGradient", "ADBE Lightning 2", "ADBE AudSpect", "ADBE AudWave",
            "ADBE Laser", "CC Glue Gun", "CC Light Burst 2.5", "CC Light Rays",
        ];

        for effect_name in effect_names {
            self.effect_match_names.insert(effect_name.to_string());
        }
    }

    fn initialize_layer_match_names(&mut self) {
        // Based on AVLayer match names documentation
        let layer_names = vec![
            "ADBE AV Layer",
            "ADBE Marker", "ADBE Time Remapping", "ADBE MTrackers", "ADBE Mask Parade",
            "ADBE Effect Parade", "ADBE Layer Overrides",
            "ADBE Transform Group", "ADBE Anchor Point", "ADBE Position", "ADBE Position_0",
            "ADBE Position_1", "ADBE Position_2", "ADBE Scale", "ADBE Orientation",
            "ADBE Rotate X", "ADBE Rotate Y", "ADBE Rotate Z", "ADBE Opacity",
            "ADBE Audio Group", "ADBE Audio Levels", "ADBE Layer Source Alternate",
        ];

        for layer_name in layer_names {
            self.layer_match_names.insert(layer_name.to_string());
        }
    }

    fn initialize_property_match_names(&mut self) {
        // Initialize with common property match names
        let property_names = vec![
            "ADBE Transform Group", "ADBE Anchor Point", "ADBE Position", "ADBE Scale",
            "ADBE Rotation", "ADBE Opacity", "ADBE Audio Group", "ADBE Audio Levels",
            "ADBE Mask Parade", "ADBE Effect Parade", "ADBE Material Options Group",
            "ADBE Light Options Group", "ADBE Camera Options Group", "ADBE Text Properties",
            "ADBE Text Document", "ADBE Text Path Options", "ADBE Text More Options",
            "ADBE Text Animators", "ADBE Shape Layer", "ADBE Root Vectors Group",
        ];

        for property_name in property_names {
            self.property_match_names.insert(property_name.to_string());
        }
    }

    pub fn track_variable_assignment(&mut self, var_name: &str, value: &Value, target_property: Option<&str>) -> Result<(), String> {
        self.validation_context.validate_assignment(var_name, value, target_property)
    }
}

pub fn get_match_names() -> Vec<&'static str> {
    let mut match_names = Vec::new();
    match_names.extend(get_effect_match_names());
    match_names.extend(get_layer_match_names());
    match_names.extend(get_property_match_names());
    match_names
}

pub fn get_api_objects() -> HashMap<String, ApiObject> {
    let api = UnifiedApi::new();
    api.objects
}

pub fn validate_temporal_ease(value_type: &PropertyValueType, in_ease: &[Value], out_ease: &[Value]) -> Result<(), String> {
    let required_dimensions = match value_type {
        PropertyValueType::NoValue => {
            return Err("Cannot have temporal ease for NoValue property type".to_string());
        },
        PropertyValueType::Custom(_) | PropertyValueType::CustomValue => {
            return Err("Cannot have temporal ease for custom property types".to_string());
        },
        PropertyValueType::LayerIndex | PropertyValueType::MaskIndex => {
            return Err("Cannot have temporal ease for index property types".to_string());
        },
        PropertyValueType::Marker | PropertyValueType::Shape | PropertyValueType::TextDocument | PropertyValueType::ArbText => {
            return Err("Cannot have temporal ease for object property types".to_string());
        },
        PropertyValueType::OneD => 1,
        PropertyValueType::TwoD | PropertyValueType::TwoDSpatial => 2,
        PropertyValueType::ThreeD | PropertyValueType::ThreeDSpatial => 3,
        PropertyValueType::Color => 4,
    };

    if in_ease.len() != required_dimensions || out_ease.len() != required_dimensions {
        return Err(format!("Expected {} dimensions for temporal ease, got {} for in_ease and {} for out_ease",
            required_dimensions, in_ease.len(), out_ease.len()));
    }

    Ok(())
}
