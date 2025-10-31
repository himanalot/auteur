use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;
use super::layer::{Layer, LayerType};
use super::avlayer::AVLayer;
use super::textlayer::TextLayer;
use super::shapelayer::ShapeLayer;
use super::cameralayer::CameraLayer;
use super::lightlayer::LightLayer;

/// LayerCollection object - represents a collection of layers in a composition
/// Provides layer creation, management, and organization functionality
/// Core collection for layer management in After Effects compositions
pub struct LayerCollection {
    pub api_object: ApiObject,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LayerBlendingMode {
    Normal = 0,
    Dissolve = 1,
    DancingDissolve = 2,
    Darken = 3,
    Multiply = 4,
    ColorBurn = 5,
    ClassicColorBurn = 6,
    LinearBurn = 7,
    DarkerColor = 8,
    Lighten = 9,
    Screen = 10,
    ColorDodge = 11,
    ClassicColorDodge = 12,
    LinearDodge = 13,
    LighterColor = 14,
    Overlay = 15,
    SoftLight = 16,
    HardLight = 17,
    LinearLight = 18,
    VividLight = 19,
    PinLight = 20,
    HardMix = 21,
    Difference = 22,
    ClassicDifference = 23,
    Exclusion = 24,
    Subtract = 25,
    Divide = 26,
    Hue = 27,
    Saturation = 28,
    Color = 29,
    Luminosity = 30,
    Stencil_Alpha = 31,
    Stencil_Luma = 32,
    Silhouette_Alpha = 33,
    Silhouette_Luma = 34,
    Alpha_Add = 35,
    Luminescent_Premul = 36,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PrecomposeOptions {
    MoveAllAttributes = 0,
    LeaveAllAttributes = 1,
}

impl LayerCollection {
    pub fn new() -> Self {
        let mut collection = Self {
            api_object: ApiObject::new(ObjectContext::Collection),
        };
        
        collection.initialize_layer_creation_methods();
        collection.initialize_layer_management_methods();
        collection.initialize_collection_methods();
        collection.initialize_properties();
        collection
    }
    
    fn initialize_layer_creation_methods(&mut self) {
        // Layer creation methods - add layers from footage/sources
        self.api_object.methods.insert("add".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("AVItem".to_string())])
            .with_optional_params(vec![PropertyValueType::OneD])); // duration
            
        // Text layer creation methods
        self.api_object.methods.insert("addText".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::ArbText])); // sourceText
            
        self.api_object.methods.insert("addBoxText".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::TwoD])); // [width, height]
            
        self.api_object.methods.insert("addVerticalText".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::ArbText])); // sourceText
            
        self.api_object.methods.insert("addVerticalBoxText".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::TwoD])); // [width, height]
            
        // Shape layer creation
        self.api_object.methods.insert("addShape".to_string(), MethodValidation::new(0));
        
        // Solid layer creation
        self.api_object.methods.insert("addSolid".to_string(), MethodValidation::new(5)
            .with_param_types(vec![
                PropertyValueType::Color,        // color [R,G,B]
                PropertyValueType::ArbText,      // name
                PropertyValueType::OneD,         // width
                PropertyValueType::OneD,         // height
                PropertyValueType::OneD          // pixelAspect
            ])
            .with_optional_params(vec![PropertyValueType::OneD])); // duration
            
        // 3D layer creation methods
        self.api_object.methods.insert("addCamera".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::ArbText,  // name
                PropertyValueType::TwoD      // centerPoint
            ]));
            
        self.api_object.methods.insert("addLight".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::ArbText,  // name
                PropertyValueType::TwoD      // centerPoint
            ]));
            
        // Null layer creation
        self.api_object.methods.insert("addNull".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::OneD])); // duration
    }
    
    fn initialize_layer_management_methods(&mut self) {
        // Layer access and retrieval
        self.api_object.methods.insert("byName".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::ArbText]));
            
        // Layer duplication and copying
        self.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD])); // layer index
            
        // Layer removal
        self.api_object.methods.insert("remove".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD])); // layer index
            
        // Layer reordering
        self.api_object.methods.insert("moveLayerBefore".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::OneD,  // layer to move
                PropertyValueType::OneD   // target layer
            ]));
            
        self.api_object.methods.insert("moveLayerAfter".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::OneD,  // layer to move
                PropertyValueType::OneD   // target layer
            ]));
            
        self.api_object.methods.insert("moveToTop".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD])); // layer index
            
        self.api_object.methods.insert("moveToBottom".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD])); // layer index
            
        // Layer selection and visibility
        self.api_object.methods.insert("selectAll".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("deselectAll".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("selectLayers".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Array".to_string())])); // layer indices
            
        // Layer locking and shy states
        self.api_object.methods.insert("lockLayers".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Array".to_string())])); // layer indices
            
        self.api_object.methods.insert("unlockLayers".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Array".to_string())])); // layer indices
            
        self.api_object.methods.insert("showLayers".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Array".to_string())])); // layer indices
            
        self.api_object.methods.insert("hideLayers".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::Custom("Array".to_string())])); // layer indices
    }
    
    fn initialize_collection_methods(&mut self) {
        // Precomposition methods
        self.api_object.methods.insert("precompose".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),  // layerIndices
                PropertyValueType::ArbText                        // name
            ])
            .with_optional_params(vec![PropertyValueType::Custom("Boolean".to_string())])); // moveAllAttributes
            
        // Advanced precomposition with more options
        self.api_object.methods.insert("precomposeAdvanced".to_string(), MethodValidation::new(3)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),    // layerIndices
                PropertyValueType::ArbText,                         // name
                PropertyValueType::Custom("Boolean".to_string())    // moveAllAttributes
            ])
            .with_optional_params(vec![
                PropertyValueType::Custom("Boolean".to_string()),  // leaveOriginal
                PropertyValueType::OneD                             // duration
            ]));
            
        // Layer collection utilities
        self.api_object.methods.insert("getLayersByType".to_string(), MethodValidation::new(1)
            .with_param_types(vec![PropertyValueType::OneD])); // LayerType enum
            
        self.api_object.methods.insert("getSelectedLayers".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("getLockedLayers".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("getShyLayers".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("get3DLayers".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("getAdjustmentLayers".to_string(), MethodValidation::new(0));
        
        self.api_object.methods.insert("getSoloLayers".to_string(), MethodValidation::new(0));
        
        // Layer sorting and organization
        self.api_object.methods.insert("sortByName".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::Custom("Boolean".to_string())])); // ascending
            
        self.api_object.methods.insert("sortByStartTime".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::Custom("Boolean".to_string())])); // ascending
            
        self.api_object.methods.insert("sortByInPoint".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::Custom("Boolean".to_string())])); // ascending
            
        self.api_object.methods.insert("sortByOutPoint".to_string(), MethodValidation::new(0)
            .with_optional_params(vec![PropertyValueType::Custom("Boolean".to_string())])); // ascending
            
        // Batch operations
        self.api_object.methods.insert("setBlendingMode".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),  // layer indices
                PropertyValueType::OneD                           // blending mode
            ]));
            
        self.api_object.methods.insert("setQuality".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),  // layer indices
                PropertyValueType::OneD                           // quality setting
            ]));
            
        self.api_object.methods.insert("setMotionBlur".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),    // layer indices
                PropertyValueType::Custom("Boolean".to_string())   // enabled
            ]));
            
        self.api_object.methods.insert("setFrameBlending".to_string(), MethodValidation::new(2)
            .with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),    // layer indices
                PropertyValueType::Custom("Boolean".to_string())   // enabled
            ]));
    }
    
    fn initialize_properties(&mut self) {
        // Core collection properties
        self.api_object.properties.insert("length".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Layer collection statistics
        self.api_object.properties.insert("numSelected".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numLocked".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numVisible".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("num3D".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Layer type counts
        self.api_object.properties.insert("numAVLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numTextLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numShapeLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numCameraLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numLightLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numAdjustmentLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("numNullLayers".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    // Factory methods for creating different layer types
    pub fn create_av_layer() -> AVLayer {
        AVLayer::new()
    }
    
    pub fn create_text_layer() -> TextLayer {
        TextLayer::new()
    }
    
    pub fn create_shape_layer() -> ShapeLayer {
        ShapeLayer::new()
    }
    
    pub fn create_camera_layer() -> CameraLayer {
        CameraLayer::new()
    }
    
    pub fn create_light_layer() -> LightLayer {
        LightLayer::new()
    }
    
    pub fn create_null_layer() -> Layer {
        Layer::new(LayerType::Null)
    }
    
    pub fn create_adjustment_layer() -> Layer {
        Layer::new(LayerType::Adjustment)
    }
    
    // Advanced layer management methods
    pub fn validate_layer_index(&self, index: usize) -> bool {
        // Validation logic for layer indices would go here
        true
    }
    
    pub fn get_layer_count_by_type(&self, layer_type: LayerType) -> usize {
        // Count layers by type logic would go here
        0
    }
    
    pub fn find_layers_by_name(&self, name: &str) -> Vec<usize> {
        // Find layers by name logic would go here
        Vec::new()
    }
    
    pub fn get_layer_hierarchy(&self) -> Vec<(usize, usize)> {
        // Get parent-child relationships between layers
        Vec::new()
    }
    
    pub fn validate_precompose_selection(&self, layer_indices: &[usize]) -> bool {
        // Validate that selected layers can be precomposed
        true
    }
    
    pub fn calculate_precomp_duration(&self, layer_indices: &[usize]) -> f64 {
        // Calculate optimal duration for precomposition
        0.0
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_layer_collection_creation() {
        let collection = LayerCollection::new();
        assert!(collection.api_object.methods.contains_key("add"));
        assert!(collection.api_object.methods.contains_key("addText"));
        assert!(collection.api_object.methods.contains_key("addShape"));
        assert!(collection.api_object.methods.contains_key("addCamera"));
        assert!(collection.api_object.methods.contains_key("addLight"));
        assert!(collection.api_object.methods.contains_key("precompose"));
    }
    
    #[test]
    fn test_layer_creation_factories() {
        let _av_layer = LayerCollection::create_av_layer();
        let _text_layer = LayerCollection::create_text_layer();
        let _shape_layer = LayerCollection::create_shape_layer();
        let _camera_layer = LayerCollection::create_camera_layer();
        let _light_layer = LayerCollection::create_light_layer();
        let _null_layer = LayerCollection::create_null_layer();
        let _adjustment_layer = LayerCollection::create_adjustment_layer();
    }
    
    #[test]
    fn test_layer_collection_properties() {
        let collection = LayerCollection::new();
        assert!(collection.api_object.properties.contains_key("length"));
        assert!(collection.api_object.properties.contains_key("numSelected"));
        assert!(collection.api_object.properties.contains_key("numAVLayers"));
        assert!(collection.api_object.properties.contains_key("numTextLayers"));
        assert!(collection.api_object.properties.contains_key("numShapeLayers"));
        assert!(collection.api_object.properties.contains_key("numCameraLayers"));
        assert!(collection.api_object.properties.contains_key("numLightLayers"));
    }
    
    #[test]
    fn test_layer_management_methods() {
        let collection = LayerCollection::new();
        assert!(collection.api_object.methods.contains_key("byName"));
        assert!(collection.api_object.methods.contains_key("duplicate"));
        assert!(collection.api_object.methods.contains_key("remove"));
        assert!(collection.api_object.methods.contains_key("selectAll"));
        assert!(collection.api_object.methods.contains_key("moveToTop"));
        assert!(collection.api_object.methods.contains_key("sortByName"));
    }
    
    #[test]
    fn test_blending_mode_enum() {
        assert_eq!(LayerBlendingMode::Normal as i32, 0);
        assert_eq!(LayerBlendingMode::Multiply as i32, 4);
        assert_eq!(LayerBlendingMode::Screen as i32, 10);
        assert_eq!(LayerBlendingMode::Overlay as i32, 15);
        assert_eq!(LayerBlendingMode::Difference as i32, 22);
    }
    
    #[test]
    fn test_precompose_options_enum() {
        assert_eq!(PrecomposeOptions::MoveAllAttributes as i32, 0);
        assert_eq!(PrecomposeOptions::LeaveAllAttributes as i32, 1);
    }
}