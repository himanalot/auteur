use std::collections::HashMap;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComprehensiveAEApi {
    pub objects: HashMap<String, AEObject>,
    pub global_functions: HashMap<String, AEFunction>,
    pub effects: HashMap<String, AEEffect>,
    pub enums: HashMap<String, Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEObject {
    pub name: String,
    pub description: String,
    pub properties: HashMap<String, AEProperty>,
    pub methods: HashMap<String, AEMethod>,
    pub parent: Option<String>,
    pub file_reference: String,
    pub examples: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEProperty {
    pub name: String,
    pub description: String,
    pub property_type: String,
    pub read_only: bool,
    pub since_version: Option<String>,
    pub deprecated: Option<String>,
    pub example_usage: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEMethod {
    pub name: String,
    pub description: String,
    pub parameters: Vec<AEParameter>,
    pub return_type: String,
    pub since_version: Option<String>,
    pub deprecated: Option<String>,
    pub example_usage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEParameter {
    pub name: String,
    pub param_type: String,
    pub description: String,
    pub optional: bool,
    pub default_value: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEFunction {
    pub name: String,
    pub description: String,
    pub parameters: Vec<AEParameter>,
    pub return_type: String,
    pub example_usage: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AEEffect {
    pub name: String,
    pub match_name: String,
    pub category: String,
    pub description: String,
    pub properties: HashMap<String, AEProperty>,
}

pub struct MethodInfo {
    pub description: String,
    pub parameters: Vec<ParameterInfo>,
    pub return_type: String,
    pub parameter_validation: Option<ParameterValidationInfo>,
}

pub struct ParameterInfo {
    pub name: String,
    pub param_type: String,
    pub description: String,
    pub required: bool,
}

pub struct ParameterValidationInfo {
    pub array_size_requirements: Vec<ArraySizeRequirement>,
    pub property_type_constraints: Vec<PropertyTypeConstraint>,
    pub range_validations: Vec<RangeValidation>,
}

pub struct ArraySizeRequirement {
    pub parameter_name: String,
    pub size_rules: Vec<ArraySizeRule>,
}

pub struct ArraySizeRule {
    pub property_value_type: String,
    pub required_size: usize,
    pub description: String,
}

pub struct PropertyTypeConstraint {
    pub method_name: String,
    pub allowed_property_types: Vec<String>,
    pub error_message: String,
}

pub struct RangeValidation {
    pub parameter_name: String,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub valid_range: String,
}

impl ComprehensiveAEApi {
    pub fn new() -> Self {
        let mut api = Self {
            objects: HashMap::new(),
            global_functions: HashMap::new(),
            effects: HashMap::new(),
            enums: HashMap::new(),
        };
        
        api.populate_application_object();
        api.populate_project_object();
        api.populate_compitem_object();
        api.populate_layer_objects();
        api.populate_property_objects();
        api.populate_global_functions();
        api.populate_effects();
        api.populate_enums();
        
        api
    }

    fn populate_application_object(&mut self) {
        let mut app_object = AEObject {
            name: "Application".to_string(),
            description: "Provides access to objects and application settings within the After Effects application. The single global object is always available by its name, app.".to_string(),
            properties: HashMap::new(),
            methods: HashMap::new(),
            parent: None,
            file_reference: "docs/general/application.md".to_string(),
            examples: vec![
                "app.newProject();".to_string(),
                "var currentVersion = app.version;".to_string(),
            ],
        };

        // Add Application properties
        app_object.properties.insert("activeViewer".to_string(), AEProperty {
            name: "activeViewer".to_string(),
            description: "The Viewer object for the currently focused or active-focused viewer (Composition, Layer, or Footage) panel. Returns null if no viewers are open.".to_string(),
            property_type: "Viewer".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var viewer = app.activeViewer;".to_string()),
        });

        app_object.properties.insert("buildName".to_string(), AEProperty {
            name: "buildName".to_string(),
            description: "The name of the build of After Effects being run, used internally by Adobe for testing and troubleshooting.".to_string(),
            property_type: "String".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var build = app.buildName;".to_string()),
        });

        app_object.properties.insert("project".to_string(), AEProperty {
            name: "project".to_string(),
            description: "The project that is currently loaded.".to_string(),
            property_type: "Project".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var proj = app.project;".to_string()),
        });

        app_object.properties.insert("version".to_string(), AEProperty {
            name: "version".to_string(),
            description: "The version of After Effects being run, formatted as a string.".to_string(),
            property_type: "String".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var version = app.version;".to_string()),
        });

        // Add Application methods
        app_object.methods.insert("newProject".to_string(), AEMethod {
            name: "newProject".to_string(),
            description: "Creates a new project in After Effects, replicating the File > New > New Project menu command. If the current project has been edited, the user is prompted to save it.".to_string(),
            parameters: vec![],
            return_type: "Project".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "var newProj = app.newProject();".to_string(),
        });

        app_object.methods.insert("open".to_string(), AEMethod {
            name: "open".to_string(),
            description: "Opens a project file (.aep) or a project template file (.aet), displaying a dialog box if the current project has unsaved changes.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "file".to_string(),
                    param_type: "File".to_string(),
                    description: "An ExtendScript File object for the project file to open.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "Project".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "var proj = app.open(new File('/path/to/project.aep'));".to_string(),
        });

        app_object.methods.insert("quit".to_string(), AEMethod {
            name: "quit".to_string(),
            description: "Quits the After Effects application, prompting the user to save or discard changes as necessary.".to_string(),
            parameters: vec![],
            return_type: "void".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "app.quit();".to_string(),
        });

        app_object.methods.insert("beginUndoGroup".to_string(), AEMethod {
            name: "beginUndoGroup".to_string(),
            description: "Begins an undo group, which allows a script to logically group all of its actions as a single undoable action.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "undoString".to_string(),
                    param_type: "String".to_string(),
                    description: "The name of the undo group.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "void".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "app.beginUndoGroup('My Script Action');".to_string(),
        });

        app_object.methods.insert("endUndoGroup".to_string(), AEMethod {
            name: "endUndoGroup".to_string(),
            description: "Ends an undo group begun with app.beginUndoGroup().".to_string(),
            parameters: vec![],
            return_type: "void".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "app.endUndoGroup();".to_string(),
        });

        self.objects.insert("Application".to_string(), app_object.clone());
        self.objects.insert("app".to_string(), app_object);
    }

    fn populate_project_object(&mut self) {
        let mut project_object = AEObject {
            name: "Project".to_string(),
            description: "The project object represents an After Effects project. Attributes provide access to specific objects within the project, such as imported files or footage and compositions, and also to project settings such as the timecode base.".to_string(),
            properties: HashMap::new(),
            methods: HashMap::new(),
            parent: Some("Application".to_string()),
            file_reference: "docs/general/project.md".to_string(),
            examples: vec![
                "app.project.save();".to_string(),
                "var comp = app.project.activeItem;".to_string(),
            ],
        };

        // Add Project properties
        project_object.properties.insert("activeItem".to_string(), AEProperty {
            name: "activeItem".to_string(),
            description: "The item that is currently active and is to be acted upon, or null if no item is currently selected or if multiple items are selected.".to_string(),
            property_type: "Item".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var activeComp = app.project.activeItem;".to_string()),
        });

        project_object.properties.insert("file".to_string(), AEProperty {
            name: "file".to_string(),
            description: "The file for the currently open project, which is an ExtendScript File object, or null if the project has not been saved.".to_string(),
            property_type: "File".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var projectFile = app.project.file;".to_string()),
        });

        project_object.properties.insert("items".to_string(), AEProperty {
            name: "items".to_string(),
            description: "All items in the project.".to_string(),
            property_type: "ItemCollection".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var allItems = app.project.items;".to_string()),
        });

        // Add Project methods  
        project_object.methods.insert("save".to_string(), AEMethod {
            name: "save".to_string(),
            description: "Saves the project. The user is not shown a dialog box, and the file is saved with the current name. If the project has never been saved, the user is prompted for a name and location for the file.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "file".to_string(),
                    param_type: "File".to_string(),
                    description: "Optional. An ExtendScript File object for the file to save.".to_string(),
                    optional: true,
                    default_value: None,
                }
            ],
            return_type: "void".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "app.project.save(); // or app.project.save(new File('/path/to/save.aep'));".to_string(),
        });

        project_object.methods.insert("close".to_string(), AEMethod {
            name: "close".to_string(),
            description: "Closes the project with normal save dialogs.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "closeOptions".to_string(),
                    param_type: "CloseOptions".to_string(),
                    description: "Action to take if the project has unsaved changes.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "Boolean".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);".to_string(),
        });

        self.objects.insert("Project".to_string(), project_object);
    }

    fn populate_compitem_object(&mut self) {
        let mut compitem_object = AEObject {
            name: "CompItem".to_string(),
            description: "The CompItem object represents a composition, and allows you to manipulate it and get information about it.".to_string(),
            properties: HashMap::new(),
            methods: HashMap::new(),
            parent: Some("AVItem".to_string()),
            file_reference: "docs/item/compitem.md".to_string(),
            examples: vec![
                "var comp = app.project.activeItem;".to_string(),
                "comp.layers.addText('Hello World');".to_string(),
            ],
        };

        // Add CompItem properties
        compitem_object.properties.insert("layers".to_string(), AEProperty {
            name: "layers".to_string(),
            description: "A LayerCollection object that contains all the Layer objects for layers in this composition.".to_string(),
            property_type: "LayerCollection".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var layers = comp.layers;".to_string()),
        });

        compitem_object.properties.insert("numLayers".to_string(), AEProperty {
            name: "numLayers".to_string(),
            description: "The number of layers in the composition.".to_string(),
            property_type: "Integer".to_string(),
            read_only: true,
            since_version: None,
            deprecated: None,
            example_usage: Some("var layerCount = comp.numLayers;".to_string()),
        });

        compitem_object.properties.insert("duration".to_string(), AEProperty {
            name: "duration".to_string(),
            description: "The duration of the composition in seconds.".to_string(),
            property_type: "Number".to_string(),
            read_only: false,
            since_version: None,
            deprecated: None,
            example_usage: Some("comp.duration = 10.0; // 10 seconds".to_string()),
        });

        compitem_object.properties.insert("width".to_string(), AEProperty {
            name: "width".to_string(),
            description: "The width of the composition in pixels.".to_string(),
            property_type: "Integer".to_string(),
            read_only: false,
            since_version: None,
            deprecated: None,
            example_usage: Some("comp.width = 1920;".to_string()),
        });

        compitem_object.properties.insert("height".to_string(), AEProperty {
            name: "height".to_string(),
            description: "The height of the composition in pixels.".to_string(),
            property_type: "Integer".to_string(),
            read_only: false,
            since_version: None,
            deprecated: None,
            example_usage: Some("comp.height = 1080;".to_string()),
        });

        // Add CompItem methods
        compitem_object.methods.insert("duplicate".to_string(), AEMethod {
            name: "duplicate".to_string(),
            description: "Creates and returns a duplicate of this composition, which contains the same layers as the original.".to_string(),
            parameters: vec![],
            return_type: "CompItem".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "var duplicateComp = comp.duplicate();".to_string(),
        });

        self.objects.insert("CompItem".to_string(), compitem_object);
    }

    fn populate_layer_objects(&mut self) {
        // LayerCollection
        let mut layercollection_object = AEObject {
            name: "LayerCollection".to_string(),
            description: "The LayerCollection object represents a set of layers. The LayerCollection belonging to a CompItem object contains all the layer objects for layers in the composition.".to_string(),
            properties: HashMap::new(),
            methods: HashMap::new(),
            parent: Some("Collection".to_string()),
            file_reference: "docs/layer/layercollection.md".to_string(),
            examples: vec![
                "var layers = comp.layers;".to_string(),
                "var textLayer = layers.addText('Hello');".to_string(),
            ],
        };

        layercollection_object.methods.insert("addText".to_string(), AEMethod {
            name: "addText".to_string(),
            description: "Creates a new text layer and adds it to this collection. Creates and returns a new TextLayer object and adds it to this collection.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "sourceText".to_string(),
                    param_type: "String".to_string(),
                    description: "Optional. The source text of the new layer.".to_string(),
                    optional: true,
                    default_value: None,
                }
            ],
            return_type: "TextLayer".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "var textLayer = comp.layers.addText('Hello World');".to_string(),
        });

        layercollection_object.methods.insert("addSolid".to_string(), AEMethod {
            name: "addSolid".to_string(),
            description: "Creates a new SolidSource object, with values set as specified; sets the new SolidSource as the mainSource value of a new FootageItem object, and adds the FootageItem to the project.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "color".to_string(),
                    param_type: "Array".to_string(),
                    description: "The color of the solid, expressed as red, green, and blue values, [R, G, B], in the range [0.0..1.0].".to_string(),
                    optional: false,
                    default_value: None,
                },
                AEParameter {
                    name: "name".to_string(),
                    param_type: "String".to_string(),
                    description: "The name of the solid.".to_string(),
                    optional: false,
                    default_value: None,
                },
                AEParameter {
                    name: "width".to_string(),
                    param_type: "Number".to_string(),
                    description: "The width of the solid in pixels.".to_string(),
                    optional: false,
                    default_value: None,
                },
                AEParameter {
                    name: "height".to_string(),
                    param_type: "Number".to_string(),
                    description: "The height of the solid in pixels.".to_string(),
                    optional: false,
                    default_value: None,
                },
                AEParameter {
                    name: "pixelAspect".to_string(),
                    param_type: "Number".to_string(),
                    description: "The pixel aspect ratio for the solid.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "AVLayer".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "var solidLayer = comp.layers.addSolid([1, 0, 0], 'Red Solid', 1920, 1080, 1.0);".to_string(),
        });

        self.objects.insert("LayerCollection".to_string(), layercollection_object);
    }

    fn populate_property_objects(&mut self) {
        // Property object
        let mut property_object = AEObject {
            name: "Property".to_string(),
            description: "The Property object contains value, keyframe, and expression information about a particular AE property of a layer.".to_string(),
            properties: HashMap::new(),
            methods: HashMap::new(),
            parent: Some("PropertyBase".to_string()),
            file_reference: "docs/property/property.md".to_string(),
            examples: vec![
                "var opacity = layer.property('Opacity');".to_string(),
                "opacity.setValue(50);".to_string(),
            ],
        };

        property_object.methods.insert("setValue".to_string(), AEMethod {
            name: "setValue".to_string(),
            description: "Sets the static value of the property. If the property has keyframes, this method sets the value at the current time.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "newValue".to_string(),
                    param_type: "Any".to_string(),
                    description: "The new value for the property.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "void".to_string(),
            since_version: None,
            deprecated: None,
            example_usage: "layer.property('Opacity').setValue(50);".to_string(),
        });

        self.objects.insert("Property".to_string(), property_object);
    }

    fn populate_global_functions(&mut self) {
        self.global_functions.insert("alert".to_string(), AEFunction {
            name: "alert".to_string(),
            description: "Displays an alert box containing the specified text. The user must click OK to dismiss the alert box.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "message".to_string(),
                    param_type: "String".to_string(),
                    description: "The text to display in the alert box.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "void".to_string(),
            example_usage: "alert('Hello, World!');".to_string(),
        });

        self.global_functions.insert("isValid".to_string(), AEFunction {
            name: "isValid".to_string(),
            description: "Determines if the specified After Effects object (e.g., composition, layer, mask, etc.) still exists.".to_string(),
            parameters: vec![
                AEParameter {
                    name: "obj".to_string(),
                    param_type: "Object".to_string(),
                    description: "The After Effects object to check for validity.".to_string(),
                    optional: false,
                    default_value: None,
                }
            ],
            return_type: "Boolean".to_string(),
            example_usage: "if (isValid(layer)) { /* layer still exists */ }".to_string(),
        });

        self.global_functions.insert("generateRandomNumber".to_string(), AEFunction {
            name: "generateRandomNumber".to_string(),
            description: "Generates a random number. This avoids a problem where Math.random() would not return random values in certain versions of After Effects.".to_string(),
            parameters: vec![],
            return_type: "Number".to_string(),
            example_usage: "var randomValue = generateRandomNumber();".to_string(),
        });
    }

    fn populate_effects(&mut self) {
        // Add some common effects for demonstration
        self.effects.insert("ADBE Gaussian Blur 2".to_string(), AEEffect {
            name: "Gaussian Blur".to_string(),
            match_name: "ADBE Gaussian Blur 2".to_string(),
            category: "Blur & Sharpen".to_string(),
            description: "Blurs the layer using a Gaussian distribution.".to_string(),
            properties: HashMap::new(),
        });
    }

    fn populate_enums(&mut self) {
        self.enums.insert("BlendingMode".to_string(), vec![
            "NORMAL".to_string(),
            "MULTIPLY".to_string(),
            "SCREEN".to_string(),
            "OVERLAY".to_string(),
            "SOFT_LIGHT".to_string(),
            "HARD_LIGHT".to_string(),
            "COLOR_DODGE".to_string(),
            "COLOR_BURN".to_string(),
            "DARKEN".to_string(),
            "LIGHTEN".to_string(),
            "DIFFERENCE".to_string(),
            "EXCLUSION".to_string(),
            "HUE".to_string(),
            "SATURATION".to_string(),
            "COLOR".to_string(),
            "LUMINOSITY".to_string(),
        ]);
    }

    pub fn get_object_documentation(&self, object_name: &str, member_name: &str, member_type: &str) -> Option<String> {
        if let Some(object) = self.objects.get(object_name) {
            match member_type {
                "method" => {
                    // If the specific method exists, show its documentation
                    if let Some(method) = object.methods.get(member_name) {
                        return Some(format!(
                            "📖 {}.{}() Method Documentation:\n\n{}\n\nParameters:\n{}\n\nReturns: {}\n\nExample:\n{}\n\nReference: {}",
                            object_name,
                            member_name,
                            method.description,
                            method.parameters.iter()
                                .map(|p| format!("  • {} ({}): {}{}", 
                                    p.name, 
                                    p.param_type, 
                                    p.description,
                                    if p.optional { " [Optional]" } else { "" }
                                ))
                                .collect::<Vec<_>>()
                                .join("\n"),
                            method.return_type,
                            method.example_usage,
                            object.file_reference
                        ));
                    } else {
                        // Method doesn't exist, show available methods
                        let available_methods: Vec<String> = object.methods.keys().cloned().collect();
                        return Some(format!(
                            "📖 {} Object - Invalid method '{}()':\n\n{}\n\nAvailable methods:\n{}\n\nReference: {}",
                            object_name,
                            member_name,
                            object.description,
                            available_methods.iter()
                                .map(|m| format!("  • {}()", m))
                                .collect::<Vec<_>>()
                                .join("\n"),
                            object.file_reference
                        ));
                    }
                }
                "property" => {
                    // If the specific property exists, show its documentation
                    if let Some(property) = object.properties.get(member_name) {
                        return Some(format!(
                            "📖 {}.{} Property Documentation:\n\n{}\n\nType: {}\nRead-only: {}\n\nExample:\n{}\n\nReference: {}",
                            object_name,
                            member_name,
                            property.description,
                            property.property_type,
                            property.read_only,
                            property.example_usage.as_ref().unwrap_or(&format!("var value = {}.{};", object_name, member_name)),
                            object.file_reference
                        ));
                    } else {
                        // Property doesn't exist, show available properties
                        let available_properties: Vec<String> = object.properties.keys().cloned().collect();
                        return Some(format!(
                            "📖 {} Object - Invalid property '{}':\n\n{}\n\nAvailable properties:\n{}\n\nReference: {}",
                            object_name,
                            member_name,
                            object.description,
                            available_properties.iter()
                                .map(|p| format!("  • {}", p))
                                .collect::<Vec<_>>()
                                .join("\n"),
                            object.file_reference
                        ));
                    }
                }
                _ => {}
            }
        }

        // Check for global functions
        if member_type == "function" {
            if let Some(function) = self.global_functions.get(member_name) {
                return Some(format!(
                    "📖 {}() Global Function Documentation:\n\n{}\n\nParameters:\n{}\n\nReturns: {}\n\nExample:\n{}",
                    member_name,
                    function.description,
                    function.parameters.iter()
                        .map(|p| format!("  • {} ({}): {}{}", 
                            p.name, 
                            p.param_type, 
                            p.description,
                            if p.optional { " [Optional]" } else { "" }
                        ))
                        .collect::<Vec<_>>()
                        .join("\n"),
                    function.return_type,
                    function.example_usage
                ));
            } else {
                // Show available global functions
                let available_functions: Vec<String> = self.global_functions.keys().cloned().collect();
                return Some(format!(
                    "📖 Unknown global function '{}':\n\nAvailable global functions:\n{}",
                    member_name,
                    available_functions.iter()
                        .map(|f| format!("  • {}()", f))
                        .collect::<Vec<_>>()
                        .join("\n")
                ));
            }
        }

        None
    }

    pub fn validate_object(&self, object_name: &str) -> bool {
        self.objects.contains_key(object_name)
    }

    pub fn validate_method(&self, object_name: &str, method_name: &str) -> bool {
        if let Some(object) = self.objects.get(object_name) {
            return object.methods.contains_key(method_name);
        }
        false
    }

    pub fn validate_property(&self, object_name: &str, property_name: &str) -> bool {
        if let Some(object) = self.objects.get(object_name) {
            return object.properties.contains_key(property_name);
        }
        false
    }

    pub fn is_global_function(&self, function_name: &str) -> bool {
        self.global_functions.contains_key(function_name)
    }
}

pub fn get_comprehensive_api() -> HashMap<String, HashMap<String, MethodInfo>> {
    let mut api = HashMap::new();
    
    // Property object methods
    let mut property_methods = HashMap::new();
    
    // setTemporalEaseAtKey with detailed parameter validation
    property_methods.insert("setTemporalEaseAtKey".to_string(), MethodInfo {
        description: "Sets the incoming and outgoing temporal ease for the specified keyframe.".to_string(),
        parameters: vec![
            ParameterInfo {
                name: "keyIndex".to_string(),
                param_type: "Integer".to_string(),
                description: "The index for the keyframe, in the range [1..numKeys]".to_string(),
                required: true,
            },
            ParameterInfo {
                name: "inTemporalEase".to_string(),
                param_type: "Array of KeyframeEase objects".to_string(),
                description: "The incoming temporal ease. Array size depends on property value type.".to_string(),
                required: true,
            },
            ParameterInfo {
                name: "outTemporalEase".to_string(),
                param_type: "Array of KeyframeEase objects".to_string(),
                description: "Optional. The outgoing temporal ease. Array size depends on property value type.".to_string(),
                required: false,
            },
        ],
        return_type: "Nothing".to_string(),
        parameter_validation: Some(ParameterValidationInfo {
            array_size_requirements: vec![
                ArraySizeRequirement {
                    parameter_name: "inTemporalEase".to_string(),
                    size_rules: vec![
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD".to_string(),
                            required_size: 2,
                            description: "For 2D properties, array must contain exactly 2 KeyframeEase objects".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD".to_string(),
                            required_size: 3,
                            description: "For 3D properties, array must contain exactly 3 KeyframeEase objects".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "other".to_string(),
                            required_size: 1,
                            description: "For all other property types, array must contain exactly 1 KeyframeEase object".to_string(),
                        },
                    ],
                },
                ArraySizeRequirement {
                    parameter_name: "outTemporalEase".to_string(),
                    size_rules: vec![
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD".to_string(),
                            required_size: 2,
                            description: "For 2D properties, array must contain exactly 2 KeyframeEase objects".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD".to_string(),
                            required_size: 3,
                            description: "For 3D properties, array must contain exactly 3 KeyframeEase objects".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "other".to_string(),
                            required_size: 1,
                            description: "For all other property types, array must contain exactly 1 KeyframeEase object".to_string(),
                        },
                    ],
                },
            ],
            property_type_constraints: vec![],
            range_validations: vec![
                RangeValidation {
                    parameter_name: "keyIndex".to_string(),
                    min_value: Some(1.0),
                    max_value: None, // depends on numKeys
                    valid_range: "[1..numKeys]".to_string(),
                },
            ],
        }),
    });

    // setSpatialTangentsAtKey with detailed parameter validation
    property_methods.insert("setSpatialTangentsAtKey".to_string(), MethodInfo {
        description: "Sets the incoming and outgoing tangent vectors for the specified keyframe.".to_string(),
        parameters: vec![
            ParameterInfo {
                name: "keyIndex".to_string(),
                param_type: "Integer".to_string(),
                description: "The index for the keyframe, in the range [1..numKeys]".to_string(),
                required: true,
            },
            ParameterInfo {
                name: "inTangent".to_string(),
                param_type: "Array of floating-point values".to_string(),
                description: "The incoming tangent vector. Array size depends on property value type.".to_string(),
                required: true,
            },
            ParameterInfo {
                name: "outTangent".to_string(),
                param_type: "Array of floating-point values".to_string(),
                description: "Optional. The outgoing tangent vector. Array size depends on property value type.".to_string(),
                required: false,
            },
        ],
        return_type: "Nothing".to_string(),
        parameter_validation: Some(ParameterValidationInfo {
            array_size_requirements: vec![
                ArraySizeRequirement {
                    parameter_name: "inTangent".to_string(),
                    size_rules: vec![
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD_SPATIAL".to_string(),
                            required_size: 2,
                            description: "For 2D spatial properties, array must contain exactly 2 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD_SPATIAL".to_string(),
                            required_size: 3,
                            description: "For 3D spatial properties, array must contain exactly 3 floating-point values".to_string(),
                        },
                    ],
                },
                ArraySizeRequirement {
                    parameter_name: "outTangent".to_string(),
                    size_rules: vec![
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD_SPATIAL".to_string(),
                            required_size: 2,
                            description: "For 2D spatial properties, array must contain exactly 2 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD_SPATIAL".to_string(),
                            required_size: 3,
                            description: "For 3D spatial properties, array must contain exactly 3 floating-point values".to_string(),
                        },
                    ],
                },
            ],
            property_type_constraints: vec![
                PropertyTypeConstraint {
                    method_name: "setSpatialTangentsAtKey".to_string(),
                    allowed_property_types: vec!["PropertyValueType.TwoD_SPATIAL".to_string(), "PropertyValueType.ThreeD_SPATIAL".to_string()],
                    error_message: "setSpatialTangentsAtKey can only be used with TwoD_SPATIAL or ThreeD_SPATIAL properties".to_string(),
                },
            ],
            range_validations: vec![],
        }),
    });

    // setValue with property value type validation
    property_methods.insert("setValue".to_string(), MethodInfo {
        description: "Sets the static value of a property that has no keyframes.".to_string(),
        parameters: vec![
            ParameterInfo {
                name: "newValue".to_string(),
                param_type: "Value".to_string(),
                description: "A value appropriate for the type of property being set".to_string(),
                required: true,
            },
        ],
        return_type: "Nothing".to_string(),
        parameter_validation: Some(ParameterValidationInfo {
            array_size_requirements: vec![
                ArraySizeRequirement {
                    parameter_name: "newValue".to_string(),
                    size_rules: vec![
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD_SPATIAL".to_string(),
                            required_size: 2,
                            description: "For 2D spatial properties, value must be an array of 2 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD_SPATIAL".to_string(),
                            required_size: 3,
                            description: "For 3D spatial properties, value must be an array of 3 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.TwoD".to_string(),
                            required_size: 2,
                            description: "For 2D properties, value must be an array of 2 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.ThreeD".to_string(),
                            required_size: 3,
                            description: "For 3D properties, value must be an array of 3 floating-point values".to_string(),
                        },
                        ArraySizeRule {
                            property_value_type: "PropertyValueType.COLOR".to_string(),
                            required_size: 4,
                            description: "For color properties, value must be an array of 4 floating-point values [r, g, b, a] in range [0.0..1.0]".to_string(),
                        },
                    ],
                },
            ],
            property_type_constraints: vec![],
            range_validations: vec![],
        }),
    });

    // KeyframeEase constructor validation
    let mut keyframe_ease_methods = HashMap::new();
    keyframe_ease_methods.insert("constructor".to_string(), MethodInfo {
        description: "Creates a KeyframeEase object with speed and influence values.".to_string(),
        parameters: vec![
            ParameterInfo {
                name: "speed".to_string(),
                param_type: "Floating-point value".to_string(),
                description: "The speed value of the keyframe".to_string(),
                required: true,
            },
            ParameterInfo {
                name: "influence".to_string(),
                param_type: "Floating-point value".to_string(),
                description: "The influence value in range [0.1..100.0]".to_string(),
                required: true,
            },
        ],
        return_type: "KeyframeEase".to_string(),
        parameter_validation: Some(ParameterValidationInfo {
            array_size_requirements: vec![],
            property_type_constraints: vec![],
            range_validations: vec![
                RangeValidation {
                    parameter_name: "influence".to_string(),
                    min_value: Some(0.1),
                    max_value: Some(100.0),
                    valid_range: "[0.1..100.0]".to_string(),
                },
            ],
        }),
    });

    api.insert("Property".to_string(), property_methods);
    api.insert("KeyframeEase".to_string(), keyframe_ease_methods);
    
    api
}

pub fn get_property_value_types() -> Vec<String> {
    vec![
        "PropertyValueType.NO_VALUE".to_string(),
        "PropertyValueType.ThreeD_SPATIAL".to_string(),
        "PropertyValueType.ThreeD".to_string(),
        "PropertyValueType.TwoD_SPATIAL".to_string(),
        "PropertyValueType.TwoD".to_string(),
        "PropertyValueType.OneD".to_string(),
        "PropertyValueType.COLOR".to_string(),
        "PropertyValueType.CUSTOM_VALUE".to_string(),
        "PropertyValueType.MARKER".to_string(),
    ]
} 