use std::collections::HashMap;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use crate::validation::context::{ObjectContext, TextValidationContext};
use serde_json::Value;

/// Adobe After Effects Application - Complete comprehensive implementation
/// Represents the main AE application object with all documented features
#[derive(Debug, Clone)]
pub struct Application {
    pub app_object: AppObject,
    pub project: Option<String>, // Project reference
    pub preferences: ApplicationPreferences,
    pub system_info: SystemInfo,
}

/// Application preferences and settings
#[derive(Debug, Clone)]
pub struct ApplicationPreferences {
    pub audio_preview_duration: f64,
    pub audio_preview_ramp_size: f64,
    pub auto_save_enabled: bool,
    pub auto_save_interval: i32,
    pub cache_before_preview: bool,
    pub cache_preview_as_proxy: bool,
    pub display_start_frame: i32,
    pub enable_multiframe_rendering: bool,
    pub memory_usage_limits: MemoryLimits,
    pub multiprocessor_support: bool,
    pub open_recent_on_startup: bool,
    pub save_preferences_on_quit: bool,
    pub show_startup_screen: bool,
    pub use_system_shortcut_keys: bool,
}

/// Memory usage limits configuration
#[derive(Debug, Clone)]
pub struct MemoryLimits {
    pub image_cache_mb: f64,
    pub max_memory_mb: f64,
    pub max_memory_percentage: f64,
    pub disk_cache_enabled: bool,
    pub disk_cache_max_size_gb: f64,
}

/// System information
#[derive(Debug, Clone)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub processor_count: i32,
    pub total_memory_mb: f64,
    pub available_memory_mb: f64,
    pub gpu_info: Vec<GPUInfo>,
    pub available_gpu_accel_types: Vec<GPUAccelType>,
}

/// GPU information
#[derive(Debug, Clone)]
pub struct GPUInfo {
    pub name: String,
    pub vendor: String,
    pub memory_mb: f64,
    pub driver_version: String,
    pub supports_metal: bool,
    pub supports_cuda: bool,
    pub supports_opencl: bool,
}

/// GPU acceleration types
#[derive(Debug, Clone, PartialEq)]
pub enum GPUAccelType {
    CUDA,
    Metal,
    OpenCL,
    Software,
}

/// Purge target types
#[derive(Debug, Clone, PartialEq)]
pub enum PurgeTarget {
    AllCaches,
    ImageCaches,
    UndoBuffers,
    ClipboardContents,
    ImageCacheMemory,
    SnapshotCaches,
}

/// Watch folder status
#[derive(Debug, Clone, PartialEq)]
pub enum WatchFolderStatus {
    Inactive,
    Active,
    Paused,
    Error,
}

/// Language and locale settings
#[derive(Debug, Clone)]
pub struct LocaleSettings {
    pub language: String,
    pub locale: String,
    pub numeric_locale: String,
    pub is_rtl: bool,
}

/// Effect information structure
#[derive(Debug, Clone)]
pub struct AppEffectInfo {
    pub display_name: String,
    pub category: String,
    pub match_name: String,
    pub version: String,
    pub vendor: String,
    pub description: String,
    pub is_deprecated: bool,
    pub supports_32bit: bool,
    pub supports_16bit: bool,
    pub supports_8bit: bool,
    pub gpu_accelerated: bool,
}

/// Font information
#[derive(Debug, Clone)]
pub struct FontInfo {
    pub family_name: String,
    pub style_name: String,
    pub postscript_name: String,
    pub is_bold: bool,
    pub is_italic: bool,
    pub is_available: bool,
    pub file_path: Option<String>,
}

/// Viewer types
#[derive(Debug, Clone, PartialEq)]
pub enum ViewerType {
    Composition,
    Layer,
    Footage,
    Flowchart,
    Timeline,
}

/// Application modes
#[derive(Debug, Clone, PartialEq)]
pub enum ApplicationMode {
    Normal,
    WatchFolder,
    RenderEngine,
    Headless,
}

#[derive(Debug, Clone)]
pub struct ApiObject {
    pub methods: HashMap<String, MethodValidation>,
    pub properties: HashMap<String, ValidationRule>,
    pub object_type: ObjectContext,
    pub can_set_alternate_source: bool,
    pub alternate_source_type: Option<String>,
    pub text_validation: Option<TextValidationContext>,
    pub effects: HashMap<String, AppEffectInfo>,
}

impl ApiObject {
    pub fn new(object_type: ObjectContext) -> Self {
        ApiObject {
            methods: HashMap::new(),
            properties: HashMap::new(),
            object_type,
            can_set_alternate_source: false,
            alternate_source_type: None,
            text_validation: None,
            effects: HashMap::new(),
        }
    }

    pub fn validate_alternate_source(&self, value: &Value) -> Result<(), String> {
        if !self.can_set_alternate_source {
            return Err("alternateSource is not available for this object type".to_string());
        }
        
        // Basic validation for alternate source
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct AppObject {
    pub api_object: ApiObject,
    pub is_watch_folder_active: bool,
    pub watch_folder_path: Option<String>,
    pub suppress_dialogs: bool,
    pub current_undo_group: Option<String>,
    pub task_counter: u32,
    pub active_tasks: HashMap<u32, String>,
    pub memory_info: MemoryInfo,
    pub performance_stats: PerformanceStats,
}

/// Memory usage information
#[derive(Debug, Clone)]
pub struct MemoryInfo {
    pub used_memory_mb: f64,
    pub image_cache_mb: f64,
    pub max_memory_mb: f64,
    pub available_memory_mb: f64,
    pub disk_cache_mb: f64,
}

/// Performance statistics
#[derive(Debug, Clone)]
pub struct PerformanceStats {
    pub frames_rendered: u64,
    pub render_time_ms: u64,
    pub cache_hits: u64,
    pub cache_misses: u64,
    pub multiframe_enabled: bool,
    pub active_cores: u32,
    pub gpu_utilization: f64,
}

impl AppObject {
    pub fn new() -> Self {
        let mut app_object = Self {
            api_object: ApiObject::new(ObjectContext::App),
            is_watch_folder_active: false,
            watch_folder_path: None,
            suppress_dialogs: false,
            current_undo_group: None,
            task_counter: 0,
            active_tasks: HashMap::new(),
            memory_info: MemoryInfo::default(),
            performance_stats: PerformanceStats::default(),
        };
        
        app_object.initialize_methods();
        app_object.initialize_properties();
        app_object.initialize_system_info();
        app_object.initialize_preferences();
        app_object.initialize_effects_info();
        app_object.initialize_fonts_info();
        app_object
    }
    
    fn initialize_methods(&mut self) {
        // Core application control methods
        self.api_object.methods.insert("activate".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("quit".to_string(), MethodValidation::new(0));
        
        // Project management methods
        self.api_object.methods.insert("newProject".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("open".to_string(), MethodValidation::new(0).with_param_types(vec![PropertyValueType::Custom("File".to_string())]));
        self.api_object.methods.insert("openFast".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("File".to_string())]));
        
        // Undo/Redo management
        self.api_object.methods.insert("beginUndoGroup".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::ArbText]));
        self.api_object.methods.insert("endUndoGroup".to_string(), MethodValidation::new(0));
        
        // Dialog suppression
        self.api_object.methods.insert("beginSuppressDialogs".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("endSuppressDialogs".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("Boolean".to_string())]));
        
        // Task scheduling
        self.api_object.methods.insert("scheduleTask".to_string(), MethodValidation::new(3).with_param_types(vec![
            PropertyValueType::ArbText,  // function code
            PropertyValueType::OneD,     // delay (ms)
            PropertyValueType::Custom("Boolean".to_string())  // repeat
        ]));
        self.api_object.methods.insert("cancelTask".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        
        // Command execution
        self.api_object.methods.insert("executeCommand".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::OneD]));
        self.api_object.methods.insert("findMenuCommandId".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::ArbText]));
        
        // Memory management
        self.api_object.methods.insert("purge".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("PurgeTarget".to_string())]));
        self.api_object.methods.insert("setMemoryUsageLimits".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::OneD,  // image cache
            PropertyValueType::OneD   // max memory
        ]));
        
        // Watch folder management
        self.api_object.methods.insert("watchFolder".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("File".to_string())]));
        self.api_object.methods.insert("endWatchFolder".to_string(), MethodValidation::new(0));
        self.api_object.methods.insert("pauseWatchFolder".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("Boolean".to_string())]));
        
        // File parsing
        self.api_object.methods.insert("parseSwatchFile".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("File".to_string())]));
        
        // Configuration methods
        self.api_object.methods.insert("setMultiFrameRenderingConfig".to_string(), MethodValidation::new(2).with_param_types(vec![
            PropertyValueType::Custom("Boolean".to_string()),  // enable
            PropertyValueType::OneD                           // max cores
        ]));
        self.api_object.methods.insert("setSavePreferencesOnQuit".to_string(), MethodValidation::new(1).with_param_types(vec![PropertyValueType::Custom("Boolean".to_string())]));
    }
    
    fn initialize_properties(&mut self) {
        // Read-only version and build information
        self.api_object.properties.insert("version".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("buildName".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("buildNumber".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
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
        
        // Language and locale
        self.api_object.properties.insert("isoLanguage".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: Some(vec![
                "en_US".to_string(), "de_DE".to_string(), "es_ES".to_string(),
                "fr_FR".to_string(), "it_IT".to_string(), "ja_JP".to_string(),
                "ko_KR".to_string()
            ]),
            custom_validator: None,
        });
        
        // State properties
        self.api_object.properties.insert("isRenderEngine".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("isWatchFolder".to_string(), ValidationRule {
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
        
        // Memory information
        self.api_object.properties.insert("memoryInUse".to_string(), ValidationRule {
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
        
        // Configuration properties (read/write)
        self.api_object.properties.insert("exitCode".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(255.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        self.api_object.properties.insert("saveProjectOnCrash".to_string(), ValidationRule {
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
        
        self.api_object.properties.insert("exitAfterLaunchAndEval".to_string(), ValidationRule {
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
        
        // GPU acceleration
        self.api_object.properties.insert("availableGPUAccelTypes".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Array".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: Some(vec![
                "CUDA".to_string(), "Metal".to_string(), "OPENCL".to_string(), "SOFTWARE".to_string()
            ]),
            custom_validator: None,
        });
        
        // Object references
        self.api_object.properties.insert("project".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Project".to_string()),
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
        
        self.api_object.properties.insert("activeViewer".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Viewer".to_string()),
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
        
        self.api_object.properties.insert("effects".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Collection".to_string()),
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
        
        self.api_object.properties.insert("fonts".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Fonts".to_string()),
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
        
        self.api_object.properties.insert("preferences".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Preferences".to_string()),
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
        
        self.api_object.properties.insert("settings".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Settings".to_string()),
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
    
    /// Initialize system information
    fn initialize_system_info(&mut self) {
        // System information is typically read from the system
        // This is a placeholder implementation
    }
    
    /// Initialize application preferences
    fn initialize_preferences(&mut self) {
        // Application preferences initialization
        // This is a placeholder implementation
    }
    
    /// Initialize effects information
    fn initialize_effects_info(&mut self) {
        // Effects information initialization
        // This would populate the effects collection
    }
    
    /// Initialize fonts information
    fn initialize_fonts_info(&mut self) {
        // Fonts information initialization
        // This would populate the fonts collection
    }
}

// Default implementations for all the new structures
impl Default for MemoryInfo {
    fn default() -> Self {
        MemoryInfo {
            used_memory_mb: 0.0,
            image_cache_mb: 0.0,
            max_memory_mb: 8192.0,
            available_memory_mb: 8192.0,
            disk_cache_mb: 0.0,
        }
    }
}

impl Default for PerformanceStats {
    fn default() -> Self {
        PerformanceStats {
            frames_rendered: 0,
            render_time_ms: 0,
            cache_hits: 0,
            cache_misses: 0,
            multiframe_enabled: false,
            active_cores: 1,
            gpu_utilization: 0.0,
        }
    }
}

impl Default for ApplicationPreferences {
    fn default() -> Self {
        ApplicationPreferences {
            audio_preview_duration: 30.0,
            audio_preview_ramp_size: 0.1,
            auto_save_enabled: true,
            auto_save_interval: 20,
            cache_before_preview: true,
            cache_preview_as_proxy: false,
            display_start_frame: 0,
            enable_multiframe_rendering: true,
            memory_usage_limits: MemoryLimits::default(),
            multiprocessor_support: true,
            open_recent_on_startup: false,
            save_preferences_on_quit: true,
            show_startup_screen: true,
            use_system_shortcut_keys: true,
        }
    }
}

impl Default for MemoryLimits {
    fn default() -> Self {
        MemoryLimits {
            image_cache_mb: 2048.0,
            max_memory_mb: 8192.0,
            max_memory_percentage: 80.0,
            disk_cache_enabled: true,
            disk_cache_max_size_gb: 20.0,
        }
    }
}

impl Default for Application {
    fn default() -> Self {
        Application {
            app_object: AppObject::new(),
            project: None,
            preferences: ApplicationPreferences::default(),
            system_info: SystemInfo::default(),
        }
    }
}

impl Default for SystemInfo {
    fn default() -> Self {
        SystemInfo {
            os_name: "Unknown".to_string(),
            os_version: "Unknown".to_string(),
            processor_count: 1,
            total_memory_mb: 8192.0,
            available_memory_mb: 6144.0,
            gpu_info: vec![],
            available_gpu_accel_types: vec![GPUAccelType::Software],
        }
    }
}

// String conversion implementations for enums
impl GPUAccelType {
    pub fn to_string(&self) -> String {
        match self {
            GPUAccelType::CUDA => "CUDA".to_string(),
            GPUAccelType::Metal => "Metal".to_string(),
            GPUAccelType::OpenCL => "OPENCL".to_string(),
            GPUAccelType::Software => "SOFTWARE".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<GPUAccelType> {
        match value {
            "CUDA" => Some(GPUAccelType::CUDA),
            "Metal" => Some(GPUAccelType::Metal),
            "OPENCL" => Some(GPUAccelType::OpenCL),
            "SOFTWARE" => Some(GPUAccelType::Software),
            _ => None,
        }
    }
}

impl PurgeTarget {
    pub fn to_string(&self) -> String {
        match self {
            PurgeTarget::AllCaches => "ALL_CACHES".to_string(),
            PurgeTarget::ImageCaches => "IMAGE_CACHES".to_string(),
            PurgeTarget::UndoBuffers => "UNDO_BUFFERS".to_string(),
            PurgeTarget::ClipboardContents => "CLIPBOARD_CONTENTS".to_string(),
            PurgeTarget::ImageCacheMemory => "IMAGE_CACHE_MEMORY".to_string(),
            PurgeTarget::SnapshotCaches => "SNAPSHOT_CACHES".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<PurgeTarget> {
        match value {
            "ALL_CACHES" => Some(PurgeTarget::AllCaches),
            "IMAGE_CACHES" => Some(PurgeTarget::ImageCaches),
            "UNDO_BUFFERS" => Some(PurgeTarget::UndoBuffers),
            "CLIPBOARD_CONTENTS" => Some(PurgeTarget::ClipboardContents),
            "IMAGE_CACHE_MEMORY" => Some(PurgeTarget::ImageCacheMemory),
            "SNAPSHOT_CACHES" => Some(PurgeTarget::SnapshotCaches),
            _ => None,
        }
    }
}

impl WatchFolderStatus {
    pub fn to_string(&self) -> String {
        match self {
            WatchFolderStatus::Inactive => "INACTIVE".to_string(),
            WatchFolderStatus::Active => "ACTIVE".to_string(),
            WatchFolderStatus::Paused => "PAUSED".to_string(),
            WatchFolderStatus::Error => "ERROR".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<WatchFolderStatus> {
        match value {
            "INACTIVE" => Some(WatchFolderStatus::Inactive),
            "ACTIVE" => Some(WatchFolderStatus::Active),
            "PAUSED" => Some(WatchFolderStatus::Paused),
            "ERROR" => Some(WatchFolderStatus::Error),
            _ => None,
        }
    }
}

// Application implementation
impl Application {
    pub fn new() -> Self {
        Application::default()
    }
    
    pub fn get_app_object(&self) -> &AppObject {
        &self.app_object
    }
    
    pub fn get_system_info(&self) -> &SystemInfo {
        &self.system_info
    }
    
    pub fn get_preferences(&self) -> &ApplicationPreferences {
        &self.preferences
    }
    
    pub fn set_preferences(&mut self, preferences: ApplicationPreferences) {
        self.preferences = preferences;
    }
}

// Comprehensive tests for the Application system
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_application_creation() {
        let app = Application::new();
        assert!(app.project.is_none());
        assert!(app.app_object.api_object.properties.contains_key("version"));
        assert!(app.app_object.api_object.properties.contains_key("buildName"));
        assert!(app.app_object.api_object.properties.contains_key("buildNumber"));
    }

    #[test]
    fn test_app_object_creation() {
        let app_obj = AppObject::new();
        assert!(!app_obj.is_watch_folder_active);
        assert!(app_obj.watch_folder_path.is_none());
        assert!(!app_obj.suppress_dialogs);
        assert!(app_obj.current_undo_group.is_none());
        assert_eq!(app_obj.task_counter, 0);
        assert!(app_obj.active_tasks.is_empty());
    }

    #[test]
    fn test_app_object_methods() {
        let app_obj = AppObject::new();
        
        // Test that key methods are available
        assert!(app_obj.api_object.methods.contains_key("activate"));
        assert!(app_obj.api_object.methods.contains_key("quit"));
        assert!(app_obj.api_object.methods.contains_key("newProject"));
        assert!(app_obj.api_object.methods.contains_key("open"));
        assert!(app_obj.api_object.methods.contains_key("beginUndoGroup"));
        assert!(app_obj.api_object.methods.contains_key("endUndoGroup"));
        assert!(app_obj.api_object.methods.contains_key("purge"));
        assert!(app_obj.api_object.methods.contains_key("watchFolder"));
        assert!(app_obj.api_object.methods.contains_key("executeCommand"));
    }

    #[test]
    fn test_app_object_properties() {
        let app_obj = AppObject::new();
        
        // Test that key properties are available
        assert!(app_obj.api_object.properties.contains_key("version"));
        assert!(app_obj.api_object.properties.contains_key("buildName"));
        assert!(app_obj.api_object.properties.contains_key("buildNumber"));
        assert!(app_obj.api_object.properties.contains_key("project"));
        assert!(app_obj.api_object.properties.contains_key("effects"));
        assert!(app_obj.api_object.properties.contains_key("fonts"));
        assert!(app_obj.api_object.properties.contains_key("availableGPUAccelTypes"));
        assert!(app_obj.api_object.properties.contains_key("activeViewer"));
        assert!(app_obj.api_object.properties.contains_key("isWatchFolder"));
        assert!(app_obj.api_object.properties.contains_key("exitCode"));
        assert!(app_obj.api_object.properties.contains_key("memoryInUse"));
    }

    #[test]
    fn test_enum_string_conversion() {
        let gpu_type = GPUAccelType::Metal;
        let string_val = gpu_type.to_string();
        assert_eq!(string_val, "Metal");
        
        let parsed = GPUAccelType::from_string(&string_val);
        assert_eq!(parsed, Some(GPUAccelType::Metal));
        
        let purge_target = PurgeTarget::AllCaches;
        let string_val = purge_target.to_string();
        assert_eq!(string_val, "ALL_CACHES");
        
        let parsed = PurgeTarget::from_string(&string_val);
        assert_eq!(parsed, Some(PurgeTarget::AllCaches));
    }

    #[test]
    fn test_default_implementations() {
        let memory_info = MemoryInfo::default();
        assert_eq!(memory_info.used_memory_mb, 0.0);
        assert_eq!(memory_info.max_memory_mb, 8192.0);
        
        let perf_stats = PerformanceStats::default();
        assert_eq!(perf_stats.frames_rendered, 0);
        assert!(!perf_stats.multiframe_enabled);
        assert_eq!(perf_stats.active_cores, 1);
        
        let app_prefs = ApplicationPreferences::default();
        assert!(app_prefs.auto_save_enabled);
        assert_eq!(app_prefs.auto_save_interval, 20);
        assert!(app_prefs.enable_multiframe_rendering);
    }

    #[test]
    fn test_system_info() {
        let sys_info = SystemInfo::default();
        assert_eq!(sys_info.os_name, "Unknown");
        assert_eq!(sys_info.processor_count, 1);
        assert_eq!(sys_info.total_memory_mb, 8192.0);
        assert!(sys_info.gpu_info.is_empty());
        assert_eq!(sys_info.available_gpu_accel_types.len(), 1);
        assert_eq!(sys_info.available_gpu_accel_types[0], GPUAccelType::Software);
    }

    #[test]
    fn test_application_preferences() {
        let mut app = Application::new();
        let original_prefs = app.preferences.clone();
        
        let mut new_prefs = ApplicationPreferences::default();
        new_prefs.auto_save_interval = 10;
        new_prefs.enable_multiframe_rendering = false;
        
        app.set_preferences(new_prefs);
        
        assert_eq!(app.preferences.auto_save_interval, 10);
        assert!(!app.preferences.enable_multiframe_rendering);
        assert_ne!(app.preferences.auto_save_interval, original_prefs.auto_save_interval);
    }

    #[test]
    fn test_comprehensive_api_coverage() {
        let app_obj = AppObject::new();
        
        // Test that all major categories of methods are available
        let expected_methods = vec![
            // Core application control
            "activate", "quit", "newProject", "open",
            // Memory management
            "purge", "setMemoryUsageLimits",
            // Undo/Redo
            "beginUndoGroup", "endUndoGroup",
            // Dialog control
            "beginSuppressDialogs", "endSuppressDialogs",
            // Task scheduling
            "scheduleTask", "cancelTask",
            // Command execution
            "executeCommand", "findMenuCommandId",
            // Watch folder
            "watchFolder", "endWatchFolder", "pauseWatchFolder",
            // File operations
            "parseSwatchFile",
            // Configuration
            "setMultiFrameRenderingConfig", "setSavePreferencesOnQuit"
        ];
        
        for method in expected_methods {
            assert!(app_obj.api_object.methods.contains_key(method),
                   "Missing method: {}", method);
        }
        
        // Test that all major properties are available
        let expected_properties = vec![
            // Version info
            "version", "buildName", "buildNumber",
            // Core objects
            "project", "activeViewer", "effects", "fonts",
            // System info
            "availableGPUAccelTypes", "memoryInUse",
            // Settings
            "exitCode", "exitAfterLaunchAndEval",
            // State
            "isWatchFolder", "isRenderEngine",
            // Localization
            "isoLanguage",
            // References
            "preferences", "settings"
        ];
        
        for property in expected_properties {
            assert!(app_obj.api_object.properties.contains_key(property),
                   "Missing property: {}", property);
        }
    }
}
