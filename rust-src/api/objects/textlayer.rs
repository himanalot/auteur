use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::avlayer::AVLayer;
use super::layer::LayerType;

/// TextLayer object - represents text layers
/// Inherits from AVLayer → Layer → PropertyGroup → PropertyBase
/// Specialized layer type for text content
pub struct TextLayer {
    pub base: AVLayer,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ParagraphJustification {
    LeftJustify = 0,
    CenterJustify = 1,
    RightJustify = 2,
    FullJustifyLastLineLeft = 3,
    FullJustifyLastLineCenter = 4,
    FullJustifyLastLineRight = 5,
    FullJustifyLastLineFull = 6,
}

#[derive(Debug, Clone, PartialEq)]
pub enum KeyframeInterpolationType {
    Linear = 1,
    Bezier = 2,
    Hold = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PostRenderAction {
    None = 0,
    Import = 1,
    ImportAndReplaceUsage = 2,
    SetProxy = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PurgeTarget {
    AllCaches = 1,
    UndoCaches = 2,
    SnapshotCaches = 3,
    ImageCaches = 4,
}

#[derive(Debug, Clone, PartialEq)]
pub enum LanguageType {
    English = 0,
    Japanese = 1,
    ChineseTraditional = 2,
    Korean = 3,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CloseDocumentSaving {
    DoNotSaveChanges = 0,
    PromptToSaveChanges = 1,
    SaveChanges = 2,
}

impl TextLayer {
    pub fn new() -> Self {
        let mut text_layer = Self {
            base: AVLayer::new(),
        };
        
        // Set the layer type to Text
        text_layer.base.base.layer_type = LayerType::Text;
        
        text_layer.initialize_text_methods();
        text_layer.initialize_text_properties();
        text_layer
    }
    
    fn initialize_text_methods(&mut self) {
        // TextLayer-specific methods (in addition to AVLayer methods)
        
        // Text document and source text methods
        self.base.base.base.base.api_object.methods.insert("getTextDocument".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("setTextDocument".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("TextDocument".to_string())
        ]));
        
        // Source text property methods
        self.base.base.base.base.api_object.methods.insert("getSourceText".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("setSourceText".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // text content
        ]));
        
        // Path options methods
        self.base.base.base.base.api_object.methods.insert("getPathOptions".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("setPathOptions".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("PropertyGroup".to_string())  // path options
        ]));
        
        // More options methods
        self.base.base.base.base.api_object.methods.insert("getMoreOptions".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("setMoreOptions".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("PropertyGroup".to_string())  // more options
        ]));
        
        // Text animators methods
        self.base.base.base.base.api_object.methods.insert("addTextAnimator".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // animator name
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeTextAnimator".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // animator index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getTextAnimator".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // animator index
        ]));
        
        // Text selector methods
        self.base.base.base.base.api_object.methods.insert("addTextSelector".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,     // animator index
            PropertyValueType::ArbText   // selector type
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeTextSelector".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // animator index
            PropertyValueType::OneD   // selector index
        ]));
        
        // Text formatting methods
        self.base.base.base.base.api_object.methods.insert("resetCharFormatting".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("resetParagraphFormatting".to_string(), MethodValidation::new(0));
        
        // Character formatting methods
        self.base.base.base.base.api_object.methods.insert("setCharacterValue".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ArbText,                    // character property name
            PropertyValueType::Custom("Any".to_string()),  // value
            PropertyValueType::OneD                        // character index (optional)
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getCharacterValue".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // character property name
            PropertyValueType::OneD      // character index (optional)
        ]));
        
        // Paragraph formatting methods
        self.base.base.base.base.api_object.methods.insert("setParagraphValue".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ArbText,                    // paragraph property name
            PropertyValueType::Custom("Any".to_string()),  // value
            PropertyValueType::OneD                        // paragraph index (optional)
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getParagraphValue".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // paragraph property name
            PropertyValueType::OneD      // paragraph index (optional)
        ]));
        
        // Font methods
        self.base.base.base.base.api_object.methods.insert("setFont".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // font family
            PropertyValueType::ArbText   // font style
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getFont".to_string(), MethodValidation::new(0));
        
        // Text size and metrics methods
        self.base.base.base.base.api_object.methods.insert("setFontSize".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // font size in pixels
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getFontSize".to_string(), MethodValidation::new(0));
        
        // Text color methods
        self.base.base.base.base.api_object.methods.insert("setTextColor".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Color  // RGB color
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getTextColor".to_string(), MethodValidation::new(0));
        
        // Text justification and alignment
        self.base.base.base.base.api_object.methods.insert("setJustification".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // ParagraphJustification enum value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getJustification".to_string(), MethodValidation::new(0));
        
        // Text tracking and kerning
        self.base.base.base.base.api_object.methods.insert("setTracking".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // tracking value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getTracking".to_string(), MethodValidation::new(0));
        
        // Leading methods
        self.base.base.base.base.api_object.methods.insert("setLeading".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // leading value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getLeading".to_string(), MethodValidation::new(0));
        
        // Baseline shift methods
        self.base.base.base.base.api_object.methods.insert("setBaselineShift".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // baseline shift value
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getBaselineShift".to_string(), MethodValidation::new(0));
        
        // Text box and paragraph methods
        self.base.base.base.base.api_object.methods.insert("convertToBoxText".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("convertToPointText".to_string(), MethodValidation::new(0));
        
        // Text path methods
        self.base.base.base.base.api_object.methods.insert("setTextPath".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Shape".to_string())  // path shape
        ]));
        
        self.base.base.base.base.api_object.methods.insert("removeTextPath".to_string(), MethodValidation::new(0));
        
        // 3D text methods
        self.base.base.base.base.api_object.methods.insert("setPerCharacter3D".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string())
        ]));
        
        // Text selection methods
        self.base.base.base.base.api_object.methods.insert("selectTextRange".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // start index
            PropertyValueType::OneD   // end index
        ]));
        
        self.base.base.base.base.api_object.methods.insert("selectAllText".to_string(), MethodValidation::new(0));
        
        // Text search and replace methods
        self.base.base.base.base.api_object.methods.insert("findText".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::ArbText  // search text
        ]));
        
        self.base.base.base.base.api_object.methods.insert("replaceText".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::ArbText,  // search text
            PropertyValueType::ArbText   // replacement text
        ]));
        
        // Text rendering and export methods
        self.base.base.base.base.api_object.methods.insert("rasterizeText".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // resolution scale
        ]));
        
        // Text layer conversion
        self.base.base.base.base.api_object.methods.insert("convertToShape".to_string(), MethodValidation::new(0));
        
        // Text styles and presets
        self.base.base.base.base.api_object.methods.insert("applyTextPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // preset file
        ]));
        
        self.base.base.base.base.api_object.methods.insert("saveTextPreset".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::Custom("File".to_string())  // output file
        ]));
        
        // Text layer analysis methods
        self.base.base.base.base.api_object.methods.insert("getTextMetrics".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("getCharacterCount".to_string(), MethodValidation::new(0));
        
        self.base.base.base.base.api_object.methods.insert("getParagraphCount".to_string(), MethodValidation::new(0));
        
        // Text bounds and positioning
        self.base.base.base.base.api_object.methods.insert("getTextBounds".to_string(), MethodValidation::new(1).with_param_types(vec![
            PropertyValueType::OneD  // time
        ]));
        
        self.base.base.base.base.api_object.methods.insert("getCharacterBounds".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // character index
            PropertyValueType::OneD   // time
        ]));
    }
    
    fn initialize_text_properties(&mut self) {
        // TextLayer-specific properties (in addition to AVLayer properties)
        
        // Core text properties
        self.base.base.base.base.api_object.properties.insert("text".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // Source text property (the actual text content)
        self.base.base.base.base.api_object.properties.insert("sourceText".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Property".to_string()),
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
        
        // Text path options
        self.base.base.base.base.api_object.properties.insert("pathOptions".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // More options (advanced text settings)
        self.base.base.base.base.api_object.properties.insert("moreOptions".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // Text animators property group
        self.base.base.base.base.api_object.properties.insert("textAnimators".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PropertyGroup".to_string()),
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
        
        // Text type (point text vs box text)
        self.base.base.base.base.api_object.properties.insert("textType".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // POINT_TEXT
                "1".to_string(),  // BOX_TEXT
            ]),
            custom_validator: None,
        });
        
        // Text direction and orientation
        self.base.base.base.base.api_object.properties.insert("textDirection".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // LEFT_TO_RIGHT
                "1".to_string(),  // RIGHT_TO_LEFT
                "2".to_string(),  // TOP_TO_BOTTOM_LEFT_TO_RIGHT
                "3".to_string(),  // TOP_TO_BOTTOM_RIGHT_TO_LEFT
            ]),
            custom_validator: None,
        });
        
        // 3D per-character properties
        self.base.base.base.base.api_object.properties.insert("threeDPerChar".to_string(), ValidationRule {
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
        
        // Text rendering properties
        self.base.base.base.base.api_object.properties.insert("textRenderingOrder".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // FRONT_TO_BACK
                "1".to_string(),  // BACK_TO_FRONT
            ]),
            custom_validator: None,
        });
        
        // Text selection properties
        self.base.base.base.base.api_object.properties.insert("textSelectionStart".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("textSelectionEnd".to_string(), ValidationRule {
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
        
        // Text baseline and metrics
        self.base.base.base.base.api_object.properties.insert("textBaseline".to_string(), ValidationRule {
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
        
        // Font and character properties
        self.base.base.base.base.api_object.properties.insert("fontFamily".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        self.base.base.base.base.api_object.properties.insert("fontStyle".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
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
        
        self.base.base.base.base.api_object.properties.insert("fontSize".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(1296.0), // 1296 pixels max
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Text color and fill
        self.base.base.base.base.api_object.properties.insert("fillColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
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
        
        self.base.base.base.base.api_object.properties.insert("strokeColor".to_string(), ValidationRule {
            value_type: PropertyValueType::Color,
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
        
        self.base.base.base.base.api_object.properties.insert("strokeWidth".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(999.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Character spacing and formatting
        self.base.base.base.base.api_object.properties.insert("tracking".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-10000.0),
            range_max: Some(10000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("leading".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-5000.0),
            range_max: Some(5000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.base.base.base.base.api_object.properties.insert("baselineShift".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(-5000.0),
            range_max: Some(5000.0),
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Paragraph justification
        self.base.base.base.base.api_object.properties.insert("justification".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(6.0), // ParagraphJustification enum values
            is_spatial: false,
            can_vary_over_time: true,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "0".to_string(),  // LEFT_JUSTIFY
                "1".to_string(),  // CENTER_JUSTIFY
                "2".to_string(),  // RIGHT_JUSTIFY
                "3".to_string(),  // FULL_JUSTIFY_LAST_LINE_LEFT
                "4".to_string(),  // FULL_JUSTIFY_LAST_LINE_CENTER
                "5".to_string(),  // FULL_JUSTIFY_LAST_LINE_RIGHT
                "6".to_string(),  // FULL_JUSTIFY_LAST_LINE_FULL
            ]),
            custom_validator: None,
        });
        
        // Text capabilities and states
        self.base.base.base.base.api_object.properties.insert("canAnimateText".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("hasTextPath".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("isBoxText".to_string(), ValidationRule {
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
        
        // Text layer specific dimensions
        self.base.base.base.base.api_object.properties.insert("textBounds".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Rectangle".to_string()),
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
        
        // Text animator count
        self.base.base.base.base.api_object.properties.insert("textAnimatorCount".to_string(), ValidationRule {
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
        
        // Character and paragraph counts
        self.base.base.base.base.api_object.properties.insert("characterCount".to_string(), ValidationRule {
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
        
        self.base.base.base.base.api_object.properties.insert("paragraphCount".to_string(), ValidationRule {
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
    
    /// Access to the underlying AVLayer
    pub fn get_base(&self) -> &AVLayer {
        &self.base
    }
    
    /// Mutable access to the underlying AVLayer
    pub fn get_base_mut(&mut self) -> &mut AVLayer {
        &mut self.base
    }
    
    /// Check if this is a box text layer
    pub fn is_box_text(&self) -> bool {
        // This would be determined by the textType property
        // For now, return false as default (point text)
        false
    }
    
    /// Check if this text layer has 3D per-character enabled
    pub fn has_per_character_3d(&self) -> bool {
        // This would be determined by the threeDPerChar property
        // For now, return false as default
        false
    }
    
    /// Check if this text layer has a text path
    pub fn has_text_path(&self) -> bool {
        // This would check if pathOptions contains a valid path
        // For now, return false as default
        false
    }
    
    /// Get the current text content
    pub fn get_text_content(&self) -> String {
        // This would extract the text from the sourceText property
        // For now, return empty string as default
        String::new()
    }
    
    /// Get the number of text animators
    pub fn get_animator_count(&self) -> usize {
        // This would count the animators in the textAnimators property group
        // For now, return 0 as default
        0
    }
    
    /// Get the number of characters in the text
    pub fn get_character_count(&self) -> usize {
        // This would count characters in the source text
        // For now, return 0 as default
        0
    }
    
    /// Get the number of paragraphs in the text
    pub fn get_paragraph_count(&self) -> usize {
        // This would count paragraphs (line breaks) in the source text
        // For now, return 1 as default (at least one paragraph)
        1
    }
    
    /// Check if text can be animated
    pub fn can_animate_text(&self) -> bool {
        // Text layers can generally be animated unless locked or have other restrictions
        // For now, return true as default
        true
    }
    
    /// Get current font family
    pub fn get_font_family(&self) -> String {
        // This would extract the font family from text properties
        // For now, return default system font
        "Arial".to_string()
    }
    
    /// Get current font size
    pub fn get_font_size(&self) -> f64 {
        // This would extract the font size from text properties
        // For now, return default size
        72.0
    }
    
    /// Get current text color
    pub fn get_text_color(&self) -> [f64; 3] {
        // This would extract the fill color from text properties
        // For now, return white as default
        [1.0, 1.0, 1.0]
    }
    
    /// Get current paragraph justification
    pub fn get_justification(&self) -> ParagraphJustification {
        // This would extract justification from paragraph properties
        // For now, return left justify as default
        ParagraphJustification::LeftJustify
    }
}

/// Factory functions for creating different types of TextLayers
pub mod textlayer_factory {
    use super::*;
    
    /// Create a standard point text layer
    pub fn create_point_text_layer() -> TextLayer {
        let mut layer = TextLayer::new();
        // Point text setup would go here
        layer
    }
    
    /// Create a box text layer
    pub fn create_box_text_layer() -> TextLayer {
        let mut layer = TextLayer::new();
        // Box text setup would go here
        layer
    }
    
    /// Create a text layer with 3D per-character enabled
    pub fn create_3d_text_layer() -> TextLayer {
        let mut layer = TextLayer::new();
        // 3D text setup would go here
        layer
    }
    
    /// Create a text layer with path text
    pub fn create_path_text_layer() -> TextLayer {
        let mut layer = TextLayer::new();
        // Path text setup would go here
        layer
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::api::objects::layer::LayerType;
    
    #[test]
    fn test_textlayer_creation() {
        let text_layer = TextLayer::new();
        assert_eq!(*text_layer.get_base().get_base().get_layer_type(), LayerType::Text);
        assert!(!text_layer.is_box_text());
        assert!(!text_layer.has_per_character_3d());
        assert!(!text_layer.has_text_path());
    }
    
    #[test]
    #[ignore]
    fn test_textlayer_inheritance() {
        let text_layer = TextLayer::new();
        // Should inherit from AVLayer → Layer
        assert_eq!(*text_layer.get_base().get_base().get_layer_type(), LayerType::Text);
        // Should inherit from PropertyGroup
        assert_eq!(text_layer.get_base().get_base().get_base().base.get_property_type(), &super::super::propertygroup::PropertyType::NamedGroup);
    }
    
    #[test]
    fn test_textlayer_capabilities() {
        let text_layer = TextLayer::new();
        assert!(text_layer.can_animate_text());
        assert_eq!(text_layer.get_animator_count(), 0);
        assert_eq!(text_layer.get_character_count(), 0);
        assert_eq!(text_layer.get_paragraph_count(), 1);
    }
    
    #[test]
    fn test_textlayer_formatting() {
        let text_layer = TextLayer::new();
        assert_eq!(text_layer.get_font_family(), "Arial");
        assert_eq!(text_layer.get_font_size(), 72.0);
        assert_eq!(text_layer.get_text_color(), [1.0, 1.0, 1.0]);
        assert_eq!(text_layer.get_justification(), ParagraphJustification::LeftJustify);
    }
    
    #[test]
    fn test_textlayer_text_content() {
        let text_layer = TextLayer::new();
        assert_eq!(text_layer.get_text_content(), "");
    }
    
    #[test]
    fn test_paragraph_justification_values() {
        assert_eq!(ParagraphJustification::LeftJustify as u8, 0);
        assert_eq!(ParagraphJustification::CenterJustify as u8, 1);
        assert_eq!(ParagraphJustification::RightJustify as u8, 2);
        assert_eq!(ParagraphJustification::FullJustifyLastLineFull as u8, 6);
    }
}