use crate::api::objects::propertygroup::PropertyGroup;
use crate::api::objects::propertybase::PropertyType;
use std::collections::HashMap;

/// Output Module object - represents output settings for a render queue item
#[derive(Debug, Clone)]
pub struct OutputModule {
    pub base: PropertyGroup,
    
    /// Output module properties
    pub file: Option<String>,
    pub file_template: String,
    pub format: OutputFormat,
    pub name: String,
    pub post_render_action: PostRenderAction,
    pub settings: OutputModuleSettings,
    pub templates: Vec<String>,
    pub include_source_xmp_metadata: bool,
    
    /// Format-specific settings
    pub video_settings: VideoOutputSettings,
    pub audio_settings: AudioOutputSettings,
    pub color_settings: ColorOutputSettings,
    pub metadata_settings: MetadataSettings,
}

/// Output Module Collection
#[derive(Debug, Clone)]
pub struct OutputModuleCollection {
    pub items: Vec<OutputModule>,
}

/// Output format types
#[derive(Debug, Clone, PartialEq)]
pub enum OutputFormat {
    // Video formats
    QuickTime,
    QuickTimeMovie,
    AVI,
    H264,
    H265,
    MPEG4,
    
    // Image sequence formats
    PNG,
    JPEG,
    TIFF,
    TGA,
    BMP,
    PSD,
    EXR,
    DPX,
    
    // Audio formats
    WAV,
    AIFF,
    MP3,
    AAC,
    
    // Special formats
    AnimatedGIF,
    SWF,
    FLV,
    
    // Professional formats
    ProRes,
    ProRes422,
    ProRes422HQ,
    ProRes422LT,
    ProRes422Proxy,
    ProRes4444,
    ProRes4444XQ,
    DNxHD,
    DNxHR,
    
    // Raw formats
    CinemaDNG,
    OpenEXR,
    
    // Custom
    Custom(String),
}

/// Post-render actions
#[derive(Debug, Clone, PartialEq)]
pub enum PostRenderAction {
    None,
    Import,
    ImportAndReplaceUsage,
    SetProxy,
    RevealInFinder,
    RevealInExplorer,
    Custom(String),
}

/// Output module settings
#[derive(Debug, Clone)]
pub struct OutputModuleSettings {
    pub format: OutputFormat,
    pub output_file_info: OutputFileInfo,
    pub include_project_link: bool,
    pub include_source_xmp_metadata: bool,
    pub post_render_action: PostRenderAction,
}

/// Output file information
#[derive(Debug, Clone)]
pub struct OutputFileInfo {
    pub full_flat_path: String,
    pub base_path: String,
    pub file_name: String,
    pub extension: String,
    pub sequence_start_frame: Option<i32>,
    pub is_sequence: bool,
}

/// Video output settings
#[derive(Debug, Clone)]
pub struct VideoOutputSettings {
    pub codec: VideoCodec,
    pub quality: f32, // 0.0 to 1.0
    pub data_rate: Option<f32>, // Mbps
    pub frame_rate: Option<f32>,
    pub field_order: FieldOrder,
    pub pixel_aspect_ratio: f32,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub resize_quality: ResizeQuality,
    pub crop: CropSettings,
    pub time_span: TimeSpanSettings,
}

/// Video codec types
#[derive(Debug, Clone, PartialEq)]
pub enum VideoCodec {
    // QuickTime codecs
    Animation,
    AppleProRes422,
    AppleProRes422HQ,
    AppleProRes422LT,
    AppleProRes422Proxy,
    AppleProRes4444,
    AppleProRes4444XQ,
    H264,
    H265,
    HEVC,
    
    // AVI codecs
    Uncompressed,
    DV,
    MJPEG,
    
    // Professional codecs
    DNxHD,
    DNxHR,
    CineForm,
    
    // Lossless codecs
    Lossless,
    LosslessWithAlpha,
    
    // Legacy codecs
    Sorenson3,
    MPEG4,
    
    // Custom
    Custom(String),
}

/// Field order for interlaced video
#[derive(Debug, Clone, PartialEq)]
pub enum FieldOrder {
    None,
    UpperFieldFirst,
    LowerFieldFirst,
}

/// Resize quality
#[derive(Debug, Clone, PartialEq)]
pub enum ResizeQuality {
    Low,
    Medium,
    High,
    Best,
}

/// Crop settings
#[derive(Debug, Clone)]
pub struct CropSettings {
    pub top: i32,
    pub bottom: i32,
    pub left: i32,
    pub right: i32,
    pub enabled: bool,
}

/// Time span settings
#[derive(Debug, Clone)]
pub struct TimeSpanSettings {
    pub start_frame: i32,
    pub end_frame: i32,
    pub duration: f32,
    pub work_area_only: bool,
    pub time_span_start: f32,
    pub time_span_duration: f32,
}

/// Audio output settings
#[derive(Debug, Clone)]
pub struct AudioOutputSettings {
    pub codec: AudioCodec,
    pub sample_rate: f32,
    pub bit_depth: BitDepth,
    pub channels: AudioChannels,
    pub bitrate: Option<i32>, // kbps
    pub quality: f32, // 0.0 to 1.0
}

/// Audio codec types
#[derive(Debug, Clone, PartialEq)]
pub enum AudioCodec {
    Uncompressed,
    AAC,
    MP3,
    AC3,
    Vorbis,
    FLAC,
    ALAC,
    PCM,
    Custom(String),
}

/// Audio bit depth
#[derive(Debug, Clone, PartialEq)]
pub enum BitDepth {
    Bit8,
    Bit16,
    Bit24,
    Bit32,
    Bit32Float,
}

/// Audio channel configuration
#[derive(Debug, Clone, PartialEq)]
pub enum AudioChannels {
    Mono,
    Stereo,
    Surround51,
    Surround71,
    Custom(i32),
}

/// Color output settings
#[derive(Debug, Clone)]
pub struct ColorOutputSettings {
    pub depth: ColorDepth,
    pub profile: ColorProfile,
    pub premultiplied: bool,
    pub alpha_channel: AlphaChannelOption,
    pub preserve_rgb: bool,
    pub working_space: Option<String>,
}

/// Color depth options
#[derive(Debug, Clone, PartialEq)]
pub enum ColorDepth {
    Bits8,
    Bits16,
    Bits32,
    Bits32Float,
    Trillions,
    FloatingPoint,
}

/// Color profile options
#[derive(Debug, Clone, PartialEq)]
pub enum ColorProfile {
    WorkingSpace,
    sRGB,
    AdobeRGB,
    ProPhotoRGB,
    Rec709,
    Rec2020,
    ACES,
    Custom(String),
}

/// Alpha channel options
#[derive(Debug, Clone, PartialEq)]
pub enum AlphaChannelOption {
    None,
    Straight,
    Premultiplied,
    PreserveTransparency,
}

/// Metadata settings
#[derive(Debug, Clone)]
pub struct MetadataSettings {
    pub include_xmp: bool,
    pub include_exif: bool,
    pub include_iptc: bool,
    pub custom_metadata: HashMap<String, String>,
}

/// Output module template
#[derive(Debug, Clone)]
pub struct OutputModuleTemplate {
    pub name: String,
    pub settings: OutputModuleSettings,
    pub is_default: bool,
    pub category: TemplateCategory,
}

/// Template categories
#[derive(Debug, Clone, PartialEq)]
pub enum TemplateCategory {
    Broadcast,
    Web,
    Mobile,
    HighQuality,
    Draft,
    Custom,
}

impl OutputModule {
    /// Create a new output module
    pub fn new(name: &str, format: OutputFormat) -> Self {
        OutputModule {
            base: PropertyGroup::new(
                crate::validation::context::ObjectContext::OutputModule,
                PropertyType::NamedGroup,
            ),
            file: None,
            file_template: String::from("[compName]_[#####].[fileExtension]"),
            format,
            name: name.to_string(),
            post_render_action: PostRenderAction::None,
            settings: OutputModuleSettings::default(),
            templates: vec![],
            include_source_xmp_metadata: true,
            video_settings: VideoOutputSettings::default(),
            audio_settings: AudioOutputSettings::default(),
            color_settings: ColorOutputSettings::default(),
            metadata_settings: MetadataSettings::default(),
        }
    }
    
    /// Apply a template to this output module
    pub fn apply_template(&mut self, template_name: &str) -> Result<(), String> {
        match template_name {
            "Lossless" => self.apply_lossless_template(),
            "H.264 - Match Render Settings" => self.apply_h264_match_template(),
            "ProRes 422 HQ" => self.apply_prores_422_hq_template(),
            "PNG Sequence" => self.apply_png_sequence_template(),
            _ => Err(format!("Unknown template: {}", template_name)),
        }
    }
    
    /// Apply lossless template
    fn apply_lossless_template(&mut self) -> Result<(), String> {
        self.format = OutputFormat::QuickTime;
        self.video_settings.codec = VideoCodec::LosslessWithAlpha;
        self.video_settings.quality = 1.0;
        self.color_settings.depth = ColorDepth::Bits32Float;
        self.color_settings.alpha_channel = AlphaChannelOption::Straight;
        Ok(())
    }
    
    /// Apply H.264 match render settings template
    fn apply_h264_match_template(&mut self) -> Result<(), String> {
        self.format = OutputFormat::H264;
        self.video_settings.codec = VideoCodec::H264;
        self.video_settings.quality = 0.75;
        self.video_settings.data_rate = Some(10.0);
        self.audio_settings.codec = AudioCodec::AAC;
        self.audio_settings.bitrate = Some(192);
        Ok(())
    }
    
    /// Apply ProRes 422 HQ template
    fn apply_prores_422_hq_template(&mut self) -> Result<(), String> {
        self.format = OutputFormat::ProRes422HQ;
        self.video_settings.codec = VideoCodec::AppleProRes422HQ;
        self.video_settings.quality = 1.0;
        self.color_settings.depth = ColorDepth::Bits16;
        Ok(())
    }
    
    /// Apply PNG sequence template
    fn apply_png_sequence_template(&mut self) -> Result<(), String> {
        self.format = OutputFormat::PNG;
        self.file_template = String::from("[compName]_[#####].png");
        self.settings.output_file_info.is_sequence = true;
        self.color_settings.depth = ColorDepth::Bits16;
        self.color_settings.alpha_channel = AlphaChannelOption::Straight;
        Ok(())
    }
    
    /// Set output file path
    pub fn set_file(&mut self, path: &str) {
        self.file = Some(path.to_string());
        self.update_file_info(path);
    }
    
    /// Update file info from path
    fn update_file_info(&mut self, path: &str) {
        let path_obj = std::path::Path::new(path);
        
        self.settings.output_file_info.full_flat_path = path.to_string();
        
        if let Some(parent) = path_obj.parent() {
            self.settings.output_file_info.base_path = parent.to_string_lossy().to_string();
        }
        
        if let Some(file_name) = path_obj.file_stem() {
            self.settings.output_file_info.file_name = file_name.to_string_lossy().to_string();
        }
        
        if let Some(extension) = path_obj.extension() {
            self.settings.output_file_info.extension = extension.to_string_lossy().to_string();
        }
    }
    
    /// Duplicate this output module
    pub fn duplicate(&self) -> OutputModule {
        let mut new_module = self.clone();
        new_module.name = format!("{} copy", self.name);
        new_module
    }
    
    /// Validate output settings
    pub fn validate(&self) -> Result<(), Vec<String>> {
        let mut errors = vec![];
        
        // Validate file path
        if let Some(ref file) = self.file {
            if file.is_empty() {
                errors.push("Output file path cannot be empty".to_string());
            }
        }
        
        // Validate video settings
        if self.video_settings.quality < 0.0 || self.video_settings.quality > 1.0 {
            errors.push("Video quality must be between 0.0 and 1.0".to_string());
        }
        
        if let Some(fps) = self.video_settings.frame_rate {
            if fps <= 0.0 {
                errors.push("Frame rate must be positive".to_string());
            }
        }
        
        // Validate audio settings
        if self.audio_settings.sample_rate <= 0.0 {
            errors.push("Audio sample rate must be positive".to_string());
        }
        
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
    
    /// Factory method for QuickTime output
    pub fn quicktime(name: &str) -> Self {
        let mut module = Self::new(name, OutputFormat::QuickTime);
        module.video_settings.codec = VideoCodec::H264;
        module.audio_settings.codec = AudioCodec::AAC;
        module
    }
    
    /// Factory method for PNG sequence output
    pub fn png_sequence(name: &str) -> Self {
        let mut module = Self::new(name, OutputFormat::PNG);
        module.settings.output_file_info.is_sequence = true;
        module.color_settings.alpha_channel = AlphaChannelOption::Straight;
        module
    }
    
    /// Factory method for ProRes output
    pub fn prores(name: &str, variant: ProResVariant) -> Self {
        let format = match variant {
            ProResVariant::ProRes422 => OutputFormat::ProRes422,
            ProResVariant::ProRes422HQ => OutputFormat::ProRes422HQ,
            ProResVariant::ProRes422LT => OutputFormat::ProRes422LT,
            ProResVariant::ProRes422Proxy => OutputFormat::ProRes422Proxy,
            ProResVariant::ProRes4444 => OutputFormat::ProRes4444,
            ProResVariant::ProRes4444XQ => OutputFormat::ProRes4444XQ,
        };
        
        let codec = match variant {
            ProResVariant::ProRes422 => VideoCodec::AppleProRes422,
            ProResVariant::ProRes422HQ => VideoCodec::AppleProRes422HQ,
            ProResVariant::ProRes422LT => VideoCodec::AppleProRes422LT,
            ProResVariant::ProRes422Proxy => VideoCodec::AppleProRes422Proxy,
            ProResVariant::ProRes4444 => VideoCodec::AppleProRes4444,
            ProResVariant::ProRes4444XQ => VideoCodec::AppleProRes4444XQ,
        };
        
        let mut module = Self::new(name, format);
        module.video_settings.codec = codec;
        module.video_settings.quality = 1.0;
        module
    }
    
    /// Factory method for image sequence output
    pub fn image_sequence(name: &str, format: ImageSequenceFormat) -> Self {
        let output_format = match format {
            ImageSequenceFormat::PNG => OutputFormat::PNG,
            ImageSequenceFormat::JPEG => OutputFormat::JPEG,
            ImageSequenceFormat::TIFF => OutputFormat::TIFF,
            ImageSequenceFormat::EXR => OutputFormat::EXR,
            ImageSequenceFormat::DPX => OutputFormat::DPX,
        };
        
        let mut module = Self::new(name, output_format);
        module.settings.output_file_info.is_sequence = true;
        
        // Set appropriate color depth for format
        match format {
            ImageSequenceFormat::EXR => {
                module.color_settings.depth = ColorDepth::Bits32Float;
            }
            ImageSequenceFormat::DPX => {
                module.color_settings.depth = ColorDepth::Bits16;
            }
            _ => {
                module.color_settings.depth = ColorDepth::Bits8;
            }
        }
        
        module
    }
}

/// ProRes variants
#[derive(Debug, Clone, Copy)]
pub enum ProResVariant {
    ProRes422,
    ProRes422HQ,
    ProRes422LT,
    ProRes422Proxy,
    ProRes4444,
    ProRes4444XQ,
}

/// Image sequence formats
#[derive(Debug, Clone, Copy)]
pub enum ImageSequenceFormat {
    PNG,
    JPEG,
    TIFF,
    EXR,
    DPX,
}

impl Default for OutputModuleSettings {
    fn default() -> Self {
        OutputModuleSettings {
            format: OutputFormat::H264,
            output_file_info: OutputFileInfo::default(),
            include_project_link: false,
            include_source_xmp_metadata: true,
            post_render_action: PostRenderAction::None,
        }
    }
}

impl Default for OutputFileInfo {
    fn default() -> Self {
        OutputFileInfo {
            full_flat_path: String::new(),
            base_path: String::new(),
            file_name: String::new(),
            extension: String::new(),
            sequence_start_frame: None,
            is_sequence: false,
        }
    }
}

impl Default for VideoOutputSettings {
    fn default() -> Self {
        VideoOutputSettings {
            codec: VideoCodec::H264,
            quality: 0.75,
            data_rate: None,
            frame_rate: None,
            field_order: FieldOrder::None,
            pixel_aspect_ratio: 1.0,
            width: None,
            height: None,
            resize_quality: ResizeQuality::High,
            crop: CropSettings::default(),
            time_span: TimeSpanSettings::default(),
        }
    }
}

impl Default for CropSettings {
    fn default() -> Self {
        CropSettings {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            enabled: false,
        }
    }
}

impl Default for TimeSpanSettings {
    fn default() -> Self {
        TimeSpanSettings {
            start_frame: 0,
            end_frame: 0,
            duration: 0.0,
            work_area_only: false,
            time_span_start: 0.0,
            time_span_duration: 0.0,
        }
    }
}

impl Default for AudioOutputSettings {
    fn default() -> Self {
        AudioOutputSettings {
            codec: AudioCodec::AAC,
            sample_rate: 48000.0,
            bit_depth: BitDepth::Bit16,
            channels: AudioChannels::Stereo,
            bitrate: Some(192),
            quality: 0.75,
        }
    }
}

impl Default for ColorOutputSettings {
    fn default() -> Self {
        ColorOutputSettings {
            depth: ColorDepth::Bits8,
            profile: ColorProfile::WorkingSpace,
            premultiplied: true,
            alpha_channel: AlphaChannelOption::Premultiplied,
            preserve_rgb: false,
            working_space: None,
        }
    }
}

impl Default for MetadataSettings {
    fn default() -> Self {
        MetadataSettings {
            include_xmp: true,
            include_exif: false,
            include_iptc: false,
            custom_metadata: HashMap::new(),
        }
    }
}

impl OutputModuleCollection {
    /// Create a new output module collection
    pub fn new() -> Self {
        OutputModuleCollection {
            items: vec![],
        }
    }
    
    /// Add an output module to the collection
    pub fn add(&mut self, module: OutputModule) {
        self.items.push(module);
    }
    
    /// Get output module by index
    pub fn get(&self, index: usize) -> Option<&OutputModule> {
        self.items.get(index)
    }
    
    /// Get mutable output module by index
    pub fn get_mut(&mut self, index: usize) -> Option<&mut OutputModule> {
        self.items.get_mut(index)
    }
    
    /// Find output module by name
    pub fn find_by_name(&self, name: &str) -> Option<&OutputModule> {
        self.items.iter().find(|m| m.name == name)
    }
    
    /// Remove output module at index
    pub fn remove(&mut self, index: usize) -> Option<OutputModule> {
        if index < self.items.len() {
            Some(self.items.remove(index))
        } else {
            None
        }
    }
    
    /// Count of output modules
    pub fn count(&self) -> usize {
        self.items.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_output_module_creation() {
        let module = OutputModule::new("Test Output", OutputFormat::H264);
        assert_eq!(module.name, "Test Output");
        assert_eq!(module.format, OutputFormat::H264);
        assert_eq!(module.post_render_action, PostRenderAction::None);
    }
    
    #[test]
    fn test_quicktime_factory() {
        let module = OutputModule::quicktime("QuickTime Test");
        assert_eq!(module.format, OutputFormat::QuickTime);
        assert_eq!(module.video_settings.codec, VideoCodec::H264);
        assert_eq!(module.audio_settings.codec, AudioCodec::AAC);
    }
    
    #[test]
    fn test_png_sequence_factory() {
        let module = OutputModule::png_sequence("PNG Sequence");
        assert_eq!(module.format, OutputFormat::PNG);
        assert!(module.settings.output_file_info.is_sequence);
        assert_eq!(module.color_settings.alpha_channel, AlphaChannelOption::Straight);
    }
    
    #[test]
    fn test_prores_factory() {
        let module = OutputModule::prores("ProRes Test", ProResVariant::ProRes422HQ);
        assert_eq!(module.format, OutputFormat::ProRes422HQ);
        assert_eq!(module.video_settings.codec, VideoCodec::AppleProRes422HQ);
        assert_eq!(module.video_settings.quality, 1.0);
    }
    
    #[test]
    fn test_apply_template() {
        let mut module = OutputModule::new("Test", OutputFormat::H264);
        
        assert!(module.apply_template("Lossless").is_ok());
        assert_eq!(module.format, OutputFormat::QuickTime);
        assert_eq!(module.video_settings.codec, VideoCodec::LosslessWithAlpha);
        assert_eq!(module.video_settings.quality, 1.0);
        
        assert!(module.apply_template("Unknown Template").is_err());
    }
    
    #[test]
    fn test_set_file() {
        let mut module = OutputModule::new("Test", OutputFormat::H264);
        module.set_file("/path/to/output.mp4");
        
        assert_eq!(module.file, Some("/path/to/output.mp4".to_string()));
        assert_eq!(module.settings.output_file_info.full_flat_path, "/path/to/output.mp4");
        assert_eq!(module.settings.output_file_info.base_path, "/path/to");
        assert_eq!(module.settings.output_file_info.file_name, "output");
        assert_eq!(module.settings.output_file_info.extension, "mp4");
    }
    
    #[test]
    fn test_duplicate() {
        let module = OutputModule::new("Original", OutputFormat::H264);
        let duplicate = module.duplicate();
        
        assert_eq!(duplicate.name, "Original copy");
        assert_eq!(duplicate.format, module.format);
    }
    
    #[test]
    fn test_validation() {
        let mut module = OutputModule::new("Test", OutputFormat::H264);
        
        // Valid settings
        module.file = Some("/path/to/output.mp4".to_string());
        assert!(module.validate().is_ok());
        
        // Invalid quality
        module.video_settings.quality = 1.5;
        let result = module.validate();
        assert!(result.is_err());
        if let Err(errors) = result {
            assert!(errors.iter().any(|e| e.contains("quality")));
        }
        
        // Invalid frame rate
        module.video_settings.quality = 0.75;
        module.video_settings.frame_rate = Some(-1.0);
        let result = module.validate();
        assert!(result.is_err());
        if let Err(errors) = result {
            assert!(errors.iter().any(|e| e.contains("Frame rate")));
        }
    }
    
    #[test]
    fn test_output_module_collection() {
        let mut collection = OutputModuleCollection::new();
        
        collection.add(OutputModule::new("Module 1", OutputFormat::H264));
        collection.add(OutputModule::new("Module 2", OutputFormat::ProRes422));
        
        assert_eq!(collection.count(), 2);
        
        // Test get
        assert!(collection.get(0).is_some());
        assert!(collection.get(2).is_none());
        
        // Test find by name
        assert!(collection.find_by_name("Module 1").is_some());
        assert!(collection.find_by_name("Module 3").is_none());
        
        // Test remove
        let removed = collection.remove(0);
        assert!(removed.is_some());
        assert_eq!(collection.count(), 1);
    }
    
    #[test]
    fn test_image_sequence_factory() {
        let exr_module = OutputModule::image_sequence("EXR Sequence", ImageSequenceFormat::EXR);
        assert_eq!(exr_module.format, OutputFormat::EXR);
        assert_eq!(exr_module.color_settings.depth, ColorDepth::Bits32Float);
        assert!(exr_module.settings.output_file_info.is_sequence);
        
        let dpx_module = OutputModule::image_sequence("DPX Sequence", ImageSequenceFormat::DPX);
        assert_eq!(dpx_module.format, OutputFormat::DPX);
        assert_eq!(dpx_module.color_settings.depth, ColorDepth::Bits16);
    }
    
    #[test]
    fn test_audio_settings() {
        let mut module = OutputModule::new("Audio Test", OutputFormat::WAV);
        module.audio_settings = AudioOutputSettings {
            codec: AudioCodec::PCM,
            sample_rate: 96000.0,
            bit_depth: BitDepth::Bit24,
            channels: AudioChannels::Surround51,
            bitrate: None,
            quality: 1.0,
        };
        
        assert_eq!(module.audio_settings.sample_rate, 96000.0);
        assert_eq!(module.audio_settings.bit_depth, BitDepth::Bit24);
        assert_eq!(module.audio_settings.channels, AudioChannels::Surround51);
    }
    
    #[test]
    fn test_metadata_settings() {
        let mut module = OutputModule::new("Metadata Test", OutputFormat::JPEG);
        module.metadata_settings.include_xmp = true;
        module.metadata_settings.include_exif = true;
        module.metadata_settings.custom_metadata.insert("Author".to_string(), "Test Author".to_string());
        
        assert!(module.metadata_settings.include_xmp);
        assert!(module.metadata_settings.include_exif);
        assert_eq!(module.metadata_settings.custom_metadata.get("Author"), Some(&"Test Author".to_string()));
    }
}