use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

pub struct RenderQueue {
    api_object: ApiObject,
}

impl RenderQueue {
    pub fn new() -> Self {
        let mut render_queue = Self {
            api_object: ApiObject::new(ObjectContext::RenderQueue),
        };
        
        render_queue.initialize_methods();
        render_queue.initialize_properties();
        render_queue
    }
    
    fn initialize_methods(&mut self) {
        // Core rendering methods
        self.api_object.methods.insert("render".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("pauseRendering".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        self.api_object.methods.insert("stopRendering".to_string(), MethodValidation::new(0));
        
        // Window management
        self.api_object.methods.insert("showWindow".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Adobe Media Encoder integration
        self.api_object.methods.insert("queueInAME".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Item management
        self.api_object.methods.insert("item".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // item index
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Core properties
        self.api_object.properties.insert("canQueueInAME".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("rendering".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("numItems".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("queueNotify".to_string(), ValidationRule {
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
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

pub struct RenderQueueItem {
    api_object: ApiObject,
}

impl RenderQueueItem {
    pub fn new() -> Self {
        let mut render_queue_item = Self {
            api_object: ApiObject::new(ObjectContext::RenderQueueItem),
        };
        
        render_queue_item.initialize_methods();
        render_queue_item.initialize_properties();
        render_queue_item
    }
    
    fn initialize_methods(&mut self) {
        // Template management
        self.api_object.methods.insert("applyTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // template name
        ]));
        self.api_object.methods.insert("saveAsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // template name
        ]));
        
        // Settings management
        self.api_object.methods.insert("getSetting".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // setting key
        ]));
        self.api_object.methods.insert("setSetting".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,    // setting key
            PropertyValueType::CustomValue // setting value
        ]));
        self.api_object.methods.insert("getSettings".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("SettingsFormat".to_string())
        ]));
        self.api_object.methods.insert("setSettings".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("SettingsObject".to_string())
        ]));
        
        // Output module management
        self.api_object.methods.insert("outputModule".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // output module index
        ]));
        self.api_object.methods.insert("duplicate".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_properties(&mut self) {
        // Core properties
        self.api_object.properties.insert("status".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("RQItemStatus".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "QUEUED".to_string(),
                "RENDERING".to_string(),
                "DONE".to_string(),
                "WILL_CONTINUE".to_string(),
                "NEEDS_OUTPUT".to_string(),
                "UNQUEUED".to_string(),
                "PAUSED".to_string(),
                "FAILED".to_string(),
                "USER_STOPPED".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("render".to_string(), ValidationRule {
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
        
        // Time settings
        self.api_object.properties.insert("timeSpanStart".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("timeSpanDuration".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("skipFrames".to_string(), ValidationRule {
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
        
        // References
        self.api_object.properties.insert("comp".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("CompItem".to_string()),
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
        
        self.api_object.properties.insert("numOutputModules".to_string(), ValidationRule {
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
        
        // Template support
        self.api_object.properties.insert("templates".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
        
        // Notification
        self.api_object.properties.insert("queueItemNotify".to_string(), ValidationRule {
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
        
        // Frame rate and dimensions
        self.api_object.properties.insert("frameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(120.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("logType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("LogType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "ERRORS_ONLY".to_string(),
                "ERRORS_AND_SETTINGS".to_string(),
                "ERRORS_AND_PER_FRAME_INFO".to_string(),
            ]),
            custom_validator: None,
        });
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

pub struct OutputModule {
    api_object: ApiObject,
}

impl OutputModule {
    pub fn new() -> Self {
        let mut output_module = Self {
            api_object: ApiObject::new(ObjectContext::OutputModule),
        };
        
        output_module.initialize_methods();
        output_module.initialize_properties();
        output_module
    }
    
    fn initialize_methods(&mut self) {
        // Template management
        self.api_object.methods.insert("applyTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // template name
        ]));
        self.api_object.methods.insert("saveAsTemplate".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // template name
        ]));
        
        // Settings management
        self.api_object.methods.insert("getSetting".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // setting key
        ]));
        self.api_object.methods.insert("setSetting".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,    // setting key
            PropertyValueType::CustomValue // setting value
        ]));
        self.api_object.methods.insert("getSettings".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("SettingsFormat".to_string())
        ]));
        self.api_object.methods.insert("setSettings".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("SettingsObject".to_string())
        ]));
        
        // Operations
        self.api_object.methods.insert("remove".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_properties(&mut self) {
        // File output
        self.api_object.properties.insert("file".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("File".to_string()),
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
        
        self.api_object.properties.insert("name".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        // Metadata and processing
        self.api_object.properties.insert("includeSourceXMP".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("postRenderAction".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PostRenderAction".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "NONE".to_string(),
                "IMPORT".to_string(),
                "IMPORT_AND_REPLACE_USAGE".to_string(),
                "SET_PROXY".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Template support
        self.api_object.properties.insert("templates".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
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
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// Collection objects for render queue management
pub struct RQItemCollection {
    api_object: ApiObject,
}

impl RQItemCollection {
    pub fn new() -> Self {
        let mut collection = Self {
            api_object: ApiObject::new(ObjectContext::Collection),
        };
        
        collection.initialize_methods();
        collection.initialize_properties();
        collection
    }
    
    fn initialize_methods(&mut self) {
        self.api_object.methods.insert("add".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("CompItem".to_string())
        ]));
    }
    
    fn initialize_properties(&mut self) {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

pub struct OMCollection {
    api_object: ApiObject,
}

impl OMCollection {
    pub fn new() -> Self {
        let mut collection = Self {
            api_object: ApiObject::new(ObjectContext::OMCollection),
        };
        
        collection.initialize_methods();
        collection.initialize_properties();
        collection
    }
    
    fn initialize_methods(&mut self) {
        self.api_object.methods.insert("add".to_string(), MethodValidation::new(0));
    }
    
    fn initialize_properties(&mut self) {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}