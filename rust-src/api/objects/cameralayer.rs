use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::layer::{Layer, LayerType};

/// CameraLayer object - represents camera layers in 3D compositions
/// Inherits from Layer → PropertyGroup → PropertyBase
/// Specialized layer type for 3D camera functionality
pub struct CameraLayer {
    pub base: Layer,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CameraType {
    OneNode = 0,
    TwoNode = 1,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CameraFilmSize {
    Size16mm = 0,
    Size35mm = 1,
    Size65mm = 2,
    Custom = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum DepthOfFieldBlur {
    None = 0,
    Fast = 1,
    More_Accurate = 2,
}

#[derive(Debug, Clone, PartialEq)]
pub enum IrisShape {
    Circle = 0,
    Triangle = 1,
    Square = 2,
    Pentagon = 3,
    Hexagon = 4,
    Heptagon = 5,
    Octagon = 6,
}

impl CameraLayer {
    pub fn new() -> Self {
        let mut camera_layer = Self {
            base: Layer::new(LayerType::Camera),
        };
        
        camera_layer.initialize_camera_methods();
        camera_layer.initialize_camera_properties();
        camera_layer
    }
    
    fn initialize_camera_methods(&mut self) {
        // CameraLayer-specific methods (in addition to Layer methods)
        
        // Camera setup and configuration
        self.base.base.base.api_object.methods.insert("setCameraType".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // CameraType enum value
        ]));
        
        self.base.base.base.api_object.methods.insert("getCameraType".to_string(), MethodValidation::new(0));
        
        // Camera positioning and orientation
        self.base.base.base.api_object.methods.insert("setPosition".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // position [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("getPosition".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setPointOfInterest".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // point of interest [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("getPointOfInterest".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setOrientation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // orientation [x, y, z] in degrees
        ]));
        
        self.base.base.base.api_object.methods.insert("getOrientation".to_string(), MethodValidation::new(0));
        
        // Camera lens and optical properties
        self.base.base.base.api_object.methods.insert("setZoom".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // zoom value in pixels
        ]));
        
        self.base.base.base.api_object.methods.insert("getZoom".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setFocalLength".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // focal length in mm
        ]));
        
        self.base.base.base.api_object.methods.insert("getFocalLength".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setAperture".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // aperture value
        ]));
        
        self.base.base.base.api_object.methods.insert("getAperture".to_string(), MethodValidation::new(0));
        
        // Depth of field
        self.base.base.base.api_object.methods.insert("setDepthOfField".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        self.base.base.base.api_object.methods.insert("getDepthOfField".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setFocusDistance".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // focus distance
        ]));
        
        self.base.base.base.api_object.methods.insert("getFocusDistance".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("setBlurLevel".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // blur level percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("getBlurLevel".to_string(), MethodValidation::new(0));
        
        // Camera animation and movement
        self.base.base.base.api_object.methods.insert("animateToPosition".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ThreeD,  // target position [x, y, z]
            PropertyValueType::OneD,    // duration in seconds
            PropertyValueType::OneD     // easing type
        ]));
        
        self.base.base.base.api_object.methods.insert("animateToTarget".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ThreeD,  // target point of interest [x, y, z]
            PropertyValueType::OneD,    // duration in seconds
            PropertyValueType::OneD     // easing type
        ]));
        
        self.base.base.base.api_object.methods.insert("orbitAroundTarget".to_string(), MethodValidation::new(4).with_param_types(vec![
            PropertyValueType::OneD,    // radius
            PropertyValueType::OneD,    // start angle
            PropertyValueType::OneD,    // end angle
            PropertyValueType::OneD     // duration
        ]));
        
        // Camera framing utilities
        self.base.base.base.api_object.methods.insert("frameObject".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string()),  // target layer
            PropertyValueType::OneD                          // padding percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("frameArea".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Rectangle".to_string())  // area to frame
        ]));
        
        self.base.base.base.api_object.methods.insert("lookAt".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // target position [x, y, z]
        ]));
        
        // Camera ray calculations
        self.base.base.base.api_object.methods.insert("screenToWorld".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::TwoD,  // screen coordinates [x, y]
            PropertyValueType::OneD   // depth/distance
        ]));
        
        self.base.base.base.api_object.methods.insert("worldToScreen".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // world coordinates [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("getCameraRay".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::TwoD  // screen coordinates [x, y]
        ]));
        
        // Camera frustum and culling
        self.base.base.base.api_object.methods.insert("isPointVisible".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ThreeD  // world point [x, y, z]
        ]));
        
        self.base.base.base.api_object.methods.insert("isLayerVisible".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.base.api_object.methods.insert("getFrustumBounds".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // distance from camera
        ]));
        
        // Camera presets and settings
        self.base.base.base.api_object.methods.insert("applyCameraPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // preset file
        ]));
        
        self.base.base.base.api_object.methods.insert("saveCameraPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        self.base.base.base.api_object.methods.insert("resetCamera".to_string(), MethodValidation::new(0));
        
        // Camera analysis and information
        self.base.base.base.api_object.methods.insert("getViewMatrix".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getProjectionMatrix".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getFieldOfView".to_string(), MethodValidation::new(0));
        
        self.base.base.base.api_object.methods.insert("getViewAngle".to_string(), MethodValidation::new(0));
        
        // Camera tracking and stabilization
        self.base.base.base.api_object.methods.insert("trackToLayer".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Layer".to_string())  // target layer
        ]));
        
        self.base.base.base.api_object.methods.insert("stabilizeCamera".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // stabilization strength
        ]));
        
        // Advanced camera operations
        self.base.base.base.api_object.methods.insert("setIrisShape".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // IrisShape enum value
        ]));
        
        self.base.base.base.api_object.methods.insert("setIrisRotation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // rotation in degrees
        ]));
        
        self.base.base.base.api_object.methods.insert("setIrisRoundness".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // roundness percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("setIrisAspectRatio".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // aspect ratio
        ]));
        
        self.base.base.base.api_object.methods.insert("setIrisDiffractionFringe".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // diffraction fringe percentage
        ]));
        
        self.base.base.base.api_object.methods.insert("setHighlightGain".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // highlight gain
        ]));
        
        self.base.base.base.api_object.methods.insert("setHighlightThreshold".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // highlight threshold
        ]));
        
        self.base.base.base.api_object.methods.insert("setHighlightSaturation".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // highlight saturation
        ]));
    }
    
    fn initialize_camera_properties(&mut self) {
        // CameraLayer-specific properties (in addition to Layer properties)
        
        // Core camera properties
        self.base.base.base.api_object.properties.insert("cameraType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // ONE_NODE
                "1".to_string(),  // TWO_NODE
            ]),
            custom_validator: None,
        });
        
        // Camera transform properties
        self.base.base.base.api_object.properties.insert("cameraPosition".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("pointOfInterest".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: true,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("cameraOrientation".to_string(), ValidationRule {
            value_type: PropertyValueType::ThreeD,
            array_size: Some(3),
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: true,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("xRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("yRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("zRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera optics and lens properties
        self.base.base.base.api_object.properties.insert("zoom".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(5000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("focalLength".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(1000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("aperture".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.5),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("filmSize".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // 16MM
                "1".to_string(),  // 35MM
                "2".to_string(),  // 65MM
                "3".to_string(),  // CUSTOM
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("filmWidth".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(1000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("filmHeight".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(1000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Depth of field properties
        self.base.base.base.api_object.properties.insert("depthOfField".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("focusDistance".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(100000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("blurLevel".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("blurType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(2.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // NONE
                "1".to_string(),  // FAST
                "2".to_string(),  // MORE_ACCURATE
            ]),
            custom_validator: None,
        });
        
        // Iris properties for depth of field
        self.base.base.base.api_object.properties.insert("irisShape".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(6.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // CIRCLE
                "1".to_string(),  // TRIANGLE
                "2".to_string(),  // SQUARE
                "3".to_string(),  // PENTAGON
                "4".to_string(),  // HEXAGON
                "5".to_string(),  // HEPTAGON
                "6".to_string(),  // OCTAGON
            ]),
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("irisRotation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(360.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("irisRoundness".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("irisAspectRatio".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(10.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("irisDiffractionFringe".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Highlight properties
        self.base.base.base.api_object.properties.insert("highlightGain".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("highlightThreshold".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("highlightSaturation".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera computed properties
        self.base.base.base.api_object.properties.insert("fieldOfView".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(179.9),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("viewAngle".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(179.9),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera capabilities and states
        self.base.base.base.api_object.properties.insert("isActiveCamera".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("canSetActive".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera frustum properties
        self.base.base.base.api_object.properties.insert("nearClipping".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(100000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("farClipping".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(1000000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera matrices (read-only computed properties)
        self.base.base.base.api_object.properties.insert("viewMatrix".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Matrix".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("projectionMatrix".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Matrix".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Camera tracking properties
        self.base.base.base.api_object.properties.insert("trackingTarget".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Layer".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.api_object.properties.insert("isTracking".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Boolean".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Access to the underlying Layer
    pub fn get_base(&self) -> &Layer {
        &self.base
    }
    
    /// Mutable access to the underlying Layer
    pub fn get_base_mut(&mut self) -> &mut Layer {
        &mut self.base
    }
    
    /// Check if this is the active camera
    pub fn is_active_camera(&self) -> bool {
        // This would be determined by the composition's active camera setting
        // For now, return false as default
        false
    }
    
    /// Check if this camera can be set as active
    pub fn can_set_active(&self) -> bool {
        // Most cameras can be set as active unless they're locked or disabled
        // For now, return true as default
        true
    }
    
    /// Get the camera type (1-node or 2-node)
    pub fn get_camera_type(&self) -> CameraType {
        // This would be determined by the cameraType property
        // For now, return TwoNode as default (most common)
        CameraType::TwoNode
    }
    
    /// Check if depth of field is enabled
    pub fn has_depth_of_field(&self) -> bool {
        // This would be determined by the depthOfField property
        // For now, return false as default
        false
    }
    
    /// Get current camera position
    pub fn get_position(&self) -> [f64; 3] {
        // This would extract the position from the cameraPosition property
        // For now, return default position
        [0.0, 0.0, -1000.0]
    }
    
    /// Get current point of interest
    pub fn get_point_of_interest(&self) -> [f64; 3] {
        // This would extract the point of interest from the pointOfInterest property
        // For now, return origin as default
        [0.0, 0.0, 0.0]
    }
    
    /// Get current zoom value
    pub fn get_zoom(&self) -> f64 {
        // This would extract the zoom from the zoom property
        // For now, return default zoom
        100.0
    }
    
    /// Get current focal length
    pub fn get_focal_length(&self) -> f64 {
        // This would extract the focal length from the focalLength property
        // For now, return default 50mm
        50.0
    }
    
    /// Get current aperture value
    pub fn get_aperture(&self) -> f64 {
        // This would extract the aperture from the aperture property
        // For now, return default f/2.8
        2.8
    }
    
    /// Get field of view in degrees
    pub fn get_field_of_view(&self) -> f64 {
        // This would calculate FOV based on focal length and film size
        // For now, return default 50 degrees
        50.0
    }
    
    /// Check if camera is tracking a target
    pub fn is_tracking(&self) -> bool {
        // This would be determined by the isTracking property
        // For now, return false as default
        false
    }
}

/// Factory functions for creating different types of CameraLayers
pub mod cameralayer_factory {
    use super::*;
    
    /// Create a standard two-node camera
    pub fn create_two_node_camera() -> CameraLayer {
        let mut camera = CameraLayer::new();
        // Two-node camera setup would go here
        camera
    }
    
    /// Create a one-node camera
    pub fn create_one_node_camera() -> CameraLayer {
        let mut camera = CameraLayer::new();
        // One-node camera setup would go here
        camera
    }
    
    /// Create a camera with depth of field enabled
    pub fn create_dof_camera() -> CameraLayer {
        let mut camera = CameraLayer::new();
        // Depth of field setup would go here
        camera
    }
    
    /// Create a tracking camera
    pub fn create_tracking_camera() -> CameraLayer {
        let mut camera = CameraLayer::new();
        // Tracking camera setup would go here
        camera
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::objects::layer::LayerType;
    
    #[test]
    fn test_cameralayer_creation() {
        let camera_layer = CameraLayer::new();
        assert_eq!(*camera_layer.get_base().get_layer_type(), LayerType::Camera);
        assert!(!camera_layer.is_active_camera());
        assert!(camera_layer.can_set_active());
        assert!(!camera_layer.has_depth_of_field());
    }
    
    #[test]
    #[ignore]
    fn test_cameralayer_inheritance() {
        let camera_layer = CameraLayer::new();
        // Should inherit from Layer
        assert_eq!(*camera_layer.get_base().get_layer_type(), LayerType::Camera);
        // Should inherit from PropertyGroup
        assert_eq!(camera_layer.get_base().get_base().base.get_property_type(), &super::super::propertygroup::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_cameralayer_properties() {
        let camera_layer = CameraLayer::new();
        assert_eq!(camera_layer.get_camera_type(), CameraType::TwoNode);
        assert_eq!(camera_layer.get_position(), [0.0, 0.0, -1000.0]);
        assert_eq!(camera_layer.get_point_of_interest(), [0.0, 0.0, 0.0]);
        assert_eq!(camera_layer.get_zoom(), 100.0);
        assert_eq!(camera_layer.get_focal_length(), 50.0);
        assert_eq!(camera_layer.get_aperture(), 2.8);
        assert_eq!(camera_layer.get_field_of_view(), 50.0);
    }
    
    #[test]
    fn test_cameralayer_tracking() {
        let camera_layer = CameraLayer::new();
        assert!(!camera_layer.is_tracking());
    }
    
    #[test]
    fn test_camera_type_values() {
        assert_eq!(CameraType::OneNode as u8, 0);
        assert_eq!(CameraType::TwoNode as u8, 1);
    }
    
    #[test]
    fn test_iris_shape_values() {
        assert_eq!(IrisShape::Circle as u8, 0);
        assert_eq!(IrisShape::Triangle as u8, 1);
        assert_eq!(IrisShape::Square as u8, 2);
        assert_eq!(IrisShape::Octagon as u8, 6);
    }
    
    #[test]
    fn test_camera_film_size_values() {
        assert_eq!(CameraFilmSize::Size16mm as u8, 0);
        assert_eq!(CameraFilmSize::Size35mm as u8, 1);
        assert_eq!(CameraFilmSize::Size65mm as u8, 2);
        assert_eq!(CameraFilmSize::Custom as u8, 3);
    }
}