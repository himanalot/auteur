use std::collections::HashMap;
use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;

// FontObject - After Effects 24.0+ (2024)
pub struct FontObject {
    api_object: ApiObject,
}

impl FontObject {
    pub fn new() -> Self {
        let mut font_object = Self {
            api_object: ApiObject::new(ObjectContext::Property("FontObject".to_string())),
        };
        
        font_object.initialize_methods();
        font_object.initialize_properties();
        font_object
    }
    
    fn initialize_methods(&mut self) {
        // Font validation methods
        self.api_object.methods.insert("hasGlyphsFor".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // text string to check
        ]));
        
        // Design axes methods (for variable fonts)
        self.api_object.methods.insert("getDesignAxes".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("setDesignVector".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Array".to_string())  // design vector array
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Basic font information
        self.api_object.properties.insert("familyName".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("styleName".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("postScriptName".to_string(), ValidationRule {
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
        
        // Font technology and metadata
        self.api_object.properties.insert("technology".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FontTechnology".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "UNKNOWN".to_string(),
                "TYPE1".to_string(),
                "TRUETYPE".to_string(),
                "OPENTYPE".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("type".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FontType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "OUTLINE".to_string(),
                "BITMAP".to_string(),
                "COMPOSITE".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Variable font support (After Effects 24.0+)
        self.api_object.properties.insert("hasDesignAxes".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("designAxesData".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("designVector".to_string(), ValidationRule {
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
        
        // Language and script support
        self.api_object.properties.insert("writingScripts".to_string(), ValidationRule {
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
        
        // Adobe Fonts integration
        self.api_object.properties.insert("isAdobeFont".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("adobeFontID".to_string(), ValidationRule {
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
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
}

// FontsObject - Collection of all available fonts
pub struct FontsObject {
    api_object: ApiObject,
}

impl FontsObject {
    pub fn new() -> Self {
        let mut fonts_object = Self {
            api_object: ApiObject::new(ObjectContext::Collection),
        };
        
        fonts_object.initialize_methods();
        fonts_object.initialize_properties();
        fonts_object
    }
    
    fn initialize_methods(&mut self) {
        // Font collection access
        self.api_object.methods.insert("getByName".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // font name
        ]));
        
        self.api_object.methods.insert("getByPostScriptName".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // PostScript name
        ]));
        
        // Font enumeration
        self.api_object.methods.insert("getAllFontFamilies".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("getFontStylesForFamily".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // family name
        ]));
        
        // Adobe Fonts integration
        self.api_object.methods.insert("getAdobeFonts".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("activateAdobeFont".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // Adobe Font ID
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Collection properties
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
        
        self.api_object.properties.insert("numFamilies".to_string(), ValidationRule {
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

// Advanced Text Range objects for precise text manipulation
pub struct CharacterRange {
    api_object: ApiObject,
}

impl CharacterRange {
    pub fn new() -> Self {
        let mut character_range = Self {
            api_object: ApiObject::new(ObjectContext::CharacterRange),
        };
        
        character_range.initialize_methods();
        character_range.initialize_properties();
        character_range
    }
    
    fn initialize_methods(&mut self) {
        // Character formatting methods
        self.api_object.methods.insert("setCharacterStyle".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("CharacterStyle".to_string())
        ]));
        
        self.api_object.methods.insert("applyFill".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Color
        ]));
        
        self.api_object.methods.insert("applyStroke".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Color,  // stroke color
            PropertyValueType::OneD    // stroke width
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Range definition
        self.api_object.properties.insert("start".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("end".to_string(), ValidationRule {
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
        
        // Character formatting properties
        self.api_object.properties.insert("fillColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(4),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("strokeColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
            array_size: Some(4),
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("strokeWidth".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(100.0),
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

pub struct ParagraphRange {
    api_object: ApiObject,
}

impl ParagraphRange {
    pub fn new() -> Self {
        let mut paragraph_range = Self {
            api_object: ApiObject::new(ObjectContext::Property("ParagraphRange".to_string())),
        };
        
        paragraph_range.initialize_methods();
        paragraph_range.initialize_properties();
        paragraph_range
    }
    
    fn initialize_methods(&mut self) {
        // Paragraph formatting methods
        self.api_object.methods.insert("setParagraphStyle".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("ParagraphStyle".to_string())
        ]));
        
        self.api_object.methods.insert("setJustification".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("ParagraphJustification".to_string())
        ]));
    }
    
    fn initialize_properties(&mut self) {
        // Range definition
        self.api_object.properties.insert("start".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("end".to_string(), ValidationRule {
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
        
        // Paragraph properties
        self.api_object.properties.insert("justification".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("ParagraphJustification".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "LEFT_JUSTIFY".to_string(),
                "CENTER_JUSTIFY".to_string(),
                "RIGHT_JUSTIFY".to_string(),
                "FULL_JUSTIFY_LASTLINE_LEFT".to_string(),
                "FULL_JUSTIFY_LASTLINE_CENTER".to_string(),
                "FULL_JUSTIFY_LASTLINE_RIGHT".to_string(),
                "FULL_JUSTIFY_LASTLINE_FULL".to_string(),
            ]),
            custom_validator: None,
        });
        
        self.api_object.properties.insert("startIndent".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-1296.0),
            range_max: Some(1296.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("endIndent".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-1296.0),
            range_max: Some(1296.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("firstLineIndent".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-1296.0),
            range_max: Some(1296.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("spaceBefore".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-1296.0),
            range_max: Some(1296.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("spaceAfter".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-1296.0),
            range_max: Some(1296.0),
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