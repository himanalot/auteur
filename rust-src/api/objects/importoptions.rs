use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::app::ApiObject;
use std::collections::HashMap;

/// ImportOptions object for importing files into After Effects
/// Comprehensive implementation supporting all Adobe AE import functionality
#[derive(Debug, Clone)]
pub struct ImportOptions {
    api_object: ApiObject,
    pub file_path: Option<String>,
    pub import_settings: ImportSettings,
}

/// Import settings for fine-grained control
#[derive(Debug, Clone)]
pub struct ImportSettings {
    pub import_as: ImportAsType,
    pub sequence: bool,
    pub force_alphabetical: bool,
    pub range_start: Option<i32>,
    pub range_end: Option<i32>,
    pub psd_options: Option<PhotoshopImportOptions>,
    pub illustrator_options: Option<IllustratorImportOptions>,
    pub cinema4d_options: Option<Cinema4DImportOptions>,
    pub audio_options: Option<AudioImportOptions>,
    pub video_options: Option<VideoImportOptions>,
}

/// Import as type enumeration
#[derive(Debug, Clone, PartialEq)]
pub enum ImportAsType {
    Footage,           // Import as footage item
    Comp,              // Import as composition
    CompCroppedLayers, // Import as composition with cropped layers
    Project,           // Import as After Effects project
}

/// Photoshop import options
#[derive(Debug, Clone)]
pub struct PhotoshopImportOptions {
    pub import_kind: PSDImportKind,
    pub layer_options: LayerImportOptions,
    pub comp_name: Option<String>,
    pub cropped_layers: bool,
    pub live_photoshop: bool,
    pub editable_layer_styles: bool,
}

/// PSD import kinds
#[derive(Debug, Clone, PartialEq)]
pub enum PSDImportKind {
    Footage,
    CompWithCroppedLayers,
    CompWithRetainLayerSizes,
    LayerAsComp,
}

/// Layer import options
#[derive(Debug, Clone)]
pub struct LayerImportOptions {
    pub import_hidden_layers: bool,
    pub import_locked_layers: bool,
    pub merge_layer_styles: bool,
    pub preserve_layer_effects: bool,
}

/// Illustrator import options
#[derive(Debug, Clone)]
pub struct IllustratorImportOptions {
    pub import_kind: IllustratorImportKind,
    pub convert_lines_to_bezier: bool,
    pub import_as_comp: bool,
    pub comp_size: Option<(i32, i32)>,
}

/// Illustrator import kinds
#[derive(Debug, Clone, PartialEq)]
pub enum IllustratorImportKind {
    Footage,
    Comp,
    LayerAsComp,
}

/// Cinema 4D import options
#[derive(Debug, Clone)]
pub struct Cinema4DImportOptions {
    pub frame_rate: f32,
    pub import_textures: bool,
    pub merge_multipass: bool,
    pub import_timeline: bool,
}

/// Audio import options
#[derive(Debug, Clone)]
pub struct AudioImportOptions {
    pub sample_rate: Option<f32>,
    pub bit_depth: Option<i32>,
    pub interpret_timecode: bool,
    pub conform_frame_rate: Option<f32>,
}

/// Video import options
#[derive(Debug, Clone)]
pub struct VideoImportOptions {
    pub frame_rate: Option<f32>,
    pub field_order: FieldOrder,
    pub alpha_mode: AlphaMode,
    pub pixel_aspect_ratio: Option<f32>,
    pub remove_pulldown: bool,
    pub guess_pulldown: bool,
    pub color_profile: Option<String>,
}

/// Field order for interlaced video
#[derive(Debug, Clone, PartialEq)]
pub enum FieldOrder {
    Progressive,
    UpperFieldFirst,
    LowerFieldFirst,
    Unknown,
}

/// Alpha channel interpretation
#[derive(Debug, Clone, PartialEq)]
pub enum AlphaMode {
    Ignore,
    Straight,
    Premultiplied,
}

/// File type detection and validation
#[derive(Debug, Clone)]
pub struct FileTypeInfo {
    pub extension: String,
    pub mime_type: Option<String>,
    pub supported_import_types: Vec<ImportAsType>,
    pub is_sequence: bool,
    pub is_layered: bool,
}

/// Import validation result
#[derive(Debug, Clone)]
pub struct ImportValidationResult {
    pub is_valid: bool,
    pub can_import_as: Vec<ImportAsType>,
    pub recommended_settings: ImportSettings,
    pub warnings: Vec<String>,
    pub errors: Vec<String>,
}

impl ImportOptions {
    /// Create new import options
    pub fn new() -> Self {
        let mut options = Self {
            api_object: ApiObject::new(ObjectContext::Custom("ImportOptions".to_string())),
            file_path: None,
            import_settings: ImportSettings::default(),
        };
        
        options.initialize_properties();
        options.initialize_methods();
        options.initialize_file_type_detection();
        options.initialize_format_specific_options();
        options
    }
    
    /// Create import options with file
    pub fn with_file(file_path: &str) -> Self {
        let mut options = Self::new();
        options.file_path = Some(file_path.to_string());
        options.detect_and_configure_file_type();
        options
    }
    
    fn initialize_properties(&mut self) {
        // File to be imported
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
        
        // Force alphabetical order
        self.api_object.properties.insert("forceAlphabetical".to_string(), ValidationRule {
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
        
        // Import type
        self.api_object.properties.insert("importAs".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("ImportAsType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "ImportAsType.COMP_CROPPED_LAYERS".to_string(),
                "ImportAsType.FOOTAGE".to_string(),
                "ImportAsType.COMP".to_string(),
                "ImportAsType.PROJECT".to_string()
            ]),
            custom_validator: None,
        });
        
        // Sequence import
        self.api_object.properties.insert("sequence".to_string(), ValidationRule {
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
        
        // Range start for sequences
        self.api_object.properties.insert("rangeStart".to_string(), ValidationRule {
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
        
        // Range end for sequences
        self.api_object.properties.insert("rangeEnd".to_string(), ValidationRule {
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
        
        // Additional properties for comprehensive import support
        
        // PSD import options
        self.api_object.properties.insert("psdImportKind".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("PSDImportKind".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "PSDImportKind.FOOTAGE".to_string(),
                "PSDImportKind.COMP_CROPPED_LAYERS".to_string(),
                "PSDImportKind.COMP_RETAIN_LAYER_SIZES".to_string(),
                "PSDImportKind.LAYER_AS_COMP".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Live Photoshop 3D
        self.api_object.properties.insert("livePhotoshop".to_string(), ValidationRule {
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
        
        // Editable layer styles
        self.api_object.properties.insert("editableLayerStyles".to_string(), ValidationRule {
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
        
        // Alpha mode
        self.api_object.properties.insert("alphaMode".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("AlphaMode".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "AlphaMode.IGNORE".to_string(),
                "AlphaMode.STRAIGHT".to_string(),
                "AlphaMode.PREMULTIPLIED".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Field order
        self.api_object.properties.insert("fieldOrder".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FieldOrder".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "FieldOrder.PROGRESSIVE".to_string(),
                "FieldOrder.UPPER_FIELD_FIRST".to_string(),
                "FieldOrder.LOWER_FIELD_FIRST".to_string(),
                "FieldOrder.UNKNOWN".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Frame rate override
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
        
        // Pixel aspect ratio
        self.api_object.properties.insert("pixelAspectRatio".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.1),
            range_max: Some(10.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Color profile
        self.api_object.properties.insert("colorProfile".to_string(), ValidationRule {
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
    
    fn initialize_methods(&mut self) {
        // Check if file can be imported as specific type
        self.api_object.methods.insert("canImportAs".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("ImportAsType".to_string())
            ]));
            
        // Check if filename is numbered (for sequences)
        self.api_object.methods.insert("isFileNameNumbered".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // File type detection
        self.api_object.methods.insert("detectFileType".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // Sequence detection
        self.api_object.methods.insert("detectSequence".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // Validate import settings
        self.api_object.methods.insert("validateImportSettings".to_string(), 
            MethodValidation::new(0));
            
        // Get recommended settings
        self.api_object.methods.insert("getRecommendedSettings".to_string(), 
            MethodValidation::new(0));
            
        // File format specific validation
        self.api_object.methods.insert("validatePSDOptions".to_string(), 
            MethodValidation::new(0));
            
        self.api_object.methods.insert("validateIllustratorOptions".to_string(), 
            MethodValidation::new(0));
            
        self.api_object.methods.insert("validateVideoOptions".to_string(), 
            MethodValidation::new(0));
            
        self.api_object.methods.insert("validateAudioOptions".to_string(), 
            MethodValidation::new(0));
            
        // Add file type detection methods
        self.api_object.methods.insert("getSupportedFormats".to_string(), 
            MethodValidation::new(0));
            
        self.api_object.methods.insert("isFormatSupported".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // file extension
            ]));
            
        self.api_object.methods.insert("getFormatInfo".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // file extension
            ]));
            
        // Format-specific import options
        self.api_object.methods.insert("setPSDImportOptions".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("PhotoshopImportOptions".to_string())
            ]));
            
        self.api_object.methods.insert("setIllustratorImportOptions".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("IllustratorImportOptions".to_string())
            ]));
            
        self.api_object.methods.insert("setCinema4DImportOptions".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Cinema4DImportOptions".to_string())
            ]));
            
        self.api_object.methods.insert("setAudioImportOptions".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("AudioImportOptions".to_string())
            ]));
            
        self.api_object.methods.insert("setVideoImportOptions".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("VideoImportOptions".to_string())
            ]));
    }
    
    pub fn get_api_object(&self) -> &ApiObject {
        &self.api_object
    }
    
    /// Initialize file type detection
    fn initialize_file_type_detection(&mut self) {
        // Placeholder for file type detection initialization
    }
    
    /// Initialize format-specific options
    fn initialize_format_specific_options(&mut self) {
        // Placeholder for format-specific options initialization
    }
    
    /// Detect and configure file type from file path
    fn detect_and_configure_file_type(&mut self) {
        if let Some(ref file_path) = self.file_path {
            // Basic file type detection based on extension
            if let Some(extension) = std::path::Path::new(file_path)
                .extension()
                .and_then(|ext| ext.to_str())
            {
                match extension.to_lowercase().as_str() {
                    "psd" => {
                        self.import_settings.psd_options = Some(PhotoshopImportOptions::default());
                    }
                    "ai" => {
                        self.import_settings.illustrator_options = Some(IllustratorImportOptions::default());
                    }
                    "c4d" => {
                        self.import_settings.cinema4d_options = Some(Cinema4DImportOptions::default());
                    }
                    "wav" | "aiff" | "mp3" | "aac" => {
                        self.import_settings.audio_options = Some(AudioImportOptions::default());
                    }
                    "mov" | "mp4" | "avi" => {
                        self.import_settings.video_options = Some(VideoImportOptions::default());
                    }
                    _ => {
                        // Default to footage
                        self.import_settings.import_as = ImportAsType::Footage;
                    }
                }
            }
        }
    }
}

// Implementation for default values
impl Default for ImportSettings {
    fn default() -> Self {
        ImportSettings {
            import_as: ImportAsType::Footage,
            sequence: false,
            force_alphabetical: false,
            range_start: None,
            range_end: None,
            psd_options: None,
            illustrator_options: None,
            cinema4d_options: None,
            audio_options: None,
            video_options: None,
        }
    }
}

impl Default for PhotoshopImportOptions {
    fn default() -> Self {
        PhotoshopImportOptions {
            import_kind: PSDImportKind::CompWithCroppedLayers,
            layer_options: LayerImportOptions::default(),
            comp_name: None,
            cropped_layers: true,
            live_photoshop: false,
            editable_layer_styles: false,
        }
    }
}

impl Default for LayerImportOptions {
    fn default() -> Self {
        LayerImportOptions {
            import_hidden_layers: false,
            import_locked_layers: false,
            merge_layer_styles: false,
            preserve_layer_effects: true,
        }
    }
}

impl Default for IllustratorImportOptions {
    fn default() -> Self {
        IllustratorImportOptions {
            import_kind: IllustratorImportKind::Comp,
            convert_lines_to_bezier: true,
            import_as_comp: true,
            comp_size: None,
        }
    }
}

impl Default for Cinema4DImportOptions {
    fn default() -> Self {
        Cinema4DImportOptions {
            frame_rate: 24.0,
            import_textures: true,
            merge_multipass: false,
            import_timeline: true,
        }
    }
}

impl Default for AudioImportOptions {
    fn default() -> Self {
        AudioImportOptions {
            sample_rate: None,
            bit_depth: None,
            interpret_timecode: false,
            conform_frame_rate: None,
        }
    }
}

impl Default for VideoImportOptions {
    fn default() -> Self {
        VideoImportOptions {
            frame_rate: None,
            field_order: FieldOrder::Progressive,
            alpha_mode: AlphaMode::Ignore,
            pixel_aspect_ratio: None,
            remove_pulldown: false,
            guess_pulldown: false,
            color_profile: None,
        }
    }
}

// String conversion implementations for enums
impl ImportAsType {
    pub fn to_string(&self) -> String {
        match self {
            ImportAsType::Footage => "ImportAsType.FOOTAGE".to_string(),
            ImportAsType::Comp => "ImportAsType.COMP".to_string(),
            ImportAsType::CompCroppedLayers => "ImportAsType.COMP_CROPPED_LAYERS".to_string(),
            ImportAsType::Project => "ImportAsType.PROJECT".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ImportAsType> {
        match value {
            "ImportAsType.FOOTAGE" => Some(ImportAsType::Footage),
            "ImportAsType.COMP" => Some(ImportAsType::Comp),
            "ImportAsType.COMP_CROPPED_LAYERS" => Some(ImportAsType::CompCroppedLayers),
            "ImportAsType.PROJECT" => Some(ImportAsType::Project),
            _ => None,
        }
    }
}

impl PSDImportKind {
    pub fn to_string(&self) -> String {
        match self {
            PSDImportKind::Footage => "PSDImportKind.FOOTAGE".to_string(),
            PSDImportKind::CompWithCroppedLayers => "PSDImportKind.COMP_CROPPED_LAYERS".to_string(),
            PSDImportKind::CompWithRetainLayerSizes => "PSDImportKind.COMP_RETAIN_LAYER_SIZES".to_string(),
            PSDImportKind::LayerAsComp => "PSDImportKind.LAYER_AS_COMP".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<PSDImportKind> {
        match value {
            "PSDImportKind.FOOTAGE" => Some(PSDImportKind::Footage),
            "PSDImportKind.COMP_CROPPED_LAYERS" => Some(PSDImportKind::CompWithCroppedLayers),
            "PSDImportKind.COMP_RETAIN_LAYER_SIZES" => Some(PSDImportKind::CompWithRetainLayerSizes),
            "PSDImportKind.LAYER_AS_COMP" => Some(PSDImportKind::LayerAsComp),
            _ => None,
        }
    }
}

impl AlphaMode {
    pub fn to_string(&self) -> String {
        match self {
            AlphaMode::Ignore => "AlphaMode.IGNORE".to_string(),
            AlphaMode::Straight => "AlphaMode.STRAIGHT".to_string(),
            AlphaMode::Premultiplied => "AlphaMode.PREMULTIPLIED".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<AlphaMode> {
        match value {
            "AlphaMode.IGNORE" => Some(AlphaMode::Ignore),
            "AlphaMode.STRAIGHT" => Some(AlphaMode::Straight),
            "AlphaMode.PREMULTIPLIED" => Some(AlphaMode::Premultiplied),
            _ => None,
        }
    }
}

impl FieldOrder {
    pub fn to_string(&self) -> String {
        match self {
            FieldOrder::Progressive => "FieldOrder.PROGRESSIVE".to_string(),
            FieldOrder::UpperFieldFirst => "FieldOrder.UPPER_FIELD_FIRST".to_string(),
            FieldOrder::LowerFieldFirst => "FieldOrder.LOWER_FIELD_FIRST".to_string(),
            FieldOrder::Unknown => "FieldOrder.UNKNOWN".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<FieldOrder> {
        match value {
            "FieldOrder.PROGRESSIVE" => Some(FieldOrder::Progressive),
            "FieldOrder.UPPER_FIELD_FIRST" => Some(FieldOrder::UpperFieldFirst),
            "FieldOrder.LOWER_FIELD_FIRST" => Some(FieldOrder::LowerFieldFirst),
            "FieldOrder.UNKNOWN" => Some(FieldOrder::Unknown),
            _ => None,
        }
    }
}