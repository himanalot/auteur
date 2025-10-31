use crate::validation::context::ObjectContext;
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType};
use super::propertygroup::PropertyGroup;
use super::propertybase::PropertyType;

/// Project object - represents an Adobe After Effects project
/// Inherits from PropertyGroup -> PropertyBase
/// Handles all project management functionality including items, settings, operations, and metadata
pub struct ProjectObject {
    pub property_group: PropertyGroup,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectCloseOptions {
    SaveChanges,
    DoNotSaveChanges,
    PromptToSaveChanges,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectFileType {
    AEP,        // Standard After Effects project
    AEPX,       // XML-based After Effects project
    AET,        // After Effects template
    AETX,       // XML-based After Effects template
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectColorDepth {
    Depth8Bit = 8,
    Depth16Bit = 16,
    Depth32Bit = 32,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectTimeDisplayType {
    Frames,
    Timecode,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectGpuAccelType {
    Cuda,
    Metal,
    OpenCL,
    Software,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ProjectExpressionEngine {
    ExtendScript,
    JavaScript10,
}

/// Additional enums for comprehensive Adobe After Effects support
#[derive(Debug, Clone, PartialEq)]
pub enum FramesCountType {
    FC_START_1,
    FC_START_0,
    FC_TIMECODE_CONVERSION,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FeetFramesFilmType {
    MM16,
    MM35,
}

#[derive(Debug, Clone, PartialEq)]
pub enum FootageTimecodeDisplayStartType {
    FTCS_START_0,
    FTCS_USE_SOURCE_MEDIA,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ToolType {
    Tool_Arrow,              // Selection Tool
    Tool_Rotate,             // Rotation Tool
    Tool_CameraMaya,         // Unified Camera Tool
    Tool_CameraOrbit,        // Orbit Camera Tool
    Tool_CameraTrackXY,      // Track XY Camera Tool
    Tool_CameraTrackZ,       // Track Z Camera Tool
    Tool_Paintbrush,         // Brush Tool
    Tool_CloneStamp,         // Clone Stamp Tool
    Tool_Eraser,             // Eraser Tool
    Tool_Hand,               // Hand Tool
    Tool_Magnify,            // Zoom Tool
    Tool_PanBehind,          // Pan Behind (Anchor Point) Tool
    Tool_Rect,               // Rectangle Tool
    Tool_RoundedRect,        // Rounded Rectangle Tool
    Tool_Oval,               // Ellipse Tool
    Tool_Polygon,            // Polygon Tool
    Tool_Star,               // Star Tool
    Tool_TextH,              // Horizontal Type Tool
    Tool_TextV,              // Vertical Type Tool
    Tool_Pen,                // Pen Tool
    Tool_Feather,            // Mask Feather Tool
    Tool_PenPlus,            // Add Vertex Tool
    Tool_PenMinus,           // Delete Vertex Tool
    Tool_PenConvert,         // Convert Vertex Tool
    Tool_Pin,                // Puppet Pin Tool
    Tool_PinStarch,          // Puppet Starch Tool
    Tool_PinDepth,           // Puppet Overlap Tool
    Tool_Quickselect,        // Roto Brush Tool
    Tool_Hairbrush,          // Refine Edge Tool
}

#[derive(Debug, Clone, PartialEq)]
pub enum ResolveType {
    ACCEPT_THEIRS,           // Take the shared version
    ACCEPT_YOURS,            // Keep your version
    ACCEPT_THEIRS_AND_COPY,  // Copy and rename your version, then take shared
}

impl ProjectObject {
    pub fn new() -> Self {
        let mut project = Self {
            property_group: PropertyGroup::new(ObjectContext::Project, PropertyType::NamedGroup),
        };
        
        project.initialize_project_properties();
        project.initialize_project_methods();
        project.initialize_project_settings();
        project.initialize_file_operations();
        project.initialize_item_management();
        project.initialize_consolidation_features();
        project.initialize_backup_recovery();
        project.initialize_templates_presets();
        project.initialize_team_projects();
        project.initialize_missing_properties();
        project
    }
    
    /// Initialize core project properties
    fn initialize_project_properties(&mut self) {
        // Core project information
        self.property_group.base.api_object.properties.insert("file".to_string(), ValidationRule {
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
        
        // Project dirty state (unsaved changes)
        self.property_group.base.api_object.properties.insert("dirty".to_string(), ValidationRule {
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
        
        // Active item in project
        self.property_group.base.api_object.properties.insert("activeItem".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("Item".to_string()),
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
        
        // Project items collection
        self.property_group.base.api_object.properties.insert("items".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("ItemCollection".to_string()),
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
        
        // Root folder for organizing project items
        self.property_group.base.api_object.properties.insert("rootFolder".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FolderItem".to_string()),
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
        
        // Selection in project panel
        self.property_group.base.api_object.properties.insert("selection".to_string(), ValidationRule {
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
        
        // Render queue
        self.property_group.base.api_object.properties.insert("renderQueue".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("RenderQueue".to_string()),
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
        
        // Total project size in bytes
        self.property_group.base.api_object.properties.insert("totalSize".to_string(), ValidationRule {
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
        
        // Project duration in seconds
        self.property_group.base.api_object.properties.insert("duration".to_string(), ValidationRule {
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
        
        // Project frame rate
        self.property_group.base.api_object.properties.insert("frameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // XMP metadata packet
        self.property_group.base.api_object.properties.insert("xmpPacket".to_string(), ValidationRule {
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
        
        // Used fonts in project (After Effects 24.5+)
        self.property_group.base.api_object.properties.insert("usedFonts".to_string(), ValidationRule {
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
        
        // Number of compositions in project
        self.property_group.base.api_object.properties.insert("numCompositions".to_string(), ValidationRule {
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
        
        // Number of footage items in project
        self.property_group.base.api_object.properties.insert("numFootageItems".to_string(), ValidationRule {
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
        
        // Number of folder items in project
        self.property_group.base.api_object.properties.insert("numFolderItems".to_string(), ValidationRule {
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
    
    /// Initialize missing properties from Adobe documentation
    fn initialize_missing_properties(&mut self) {
        // Number of items in project (total)
        self.property_group.base.api_object.properties.insert("numItems".to_string(), ValidationRule {
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
        
        // Project revision number
        self.property_group.base.api_object.properties.insert("revision".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Display start frame (0 or 1)
        self.property_group.base.api_object.properties.insert("displayStartFrame".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(0.0),
            range_max: Some(1.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec!["0".to_string(), "1".to_string()]),
            custom_validator: None,
        });
        
        // Tool type (active tool in Tools panel)
        self.property_group.base.api_object.properties.insert("toolType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("ToolType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "Tool_Arrow".to_string(),
                "Tool_Rotate".to_string(),
                "Tool_CameraMaya".to_string(),
                "Tool_CameraOrbit".to_string(),
                "Tool_CameraTrackXY".to_string(),
                "Tool_CameraTrackZ".to_string(),
                "Tool_Paintbrush".to_string(),
                "Tool_CloneStamp".to_string(),
                "Tool_Eraser".to_string(),
                "Tool_Hand".to_string(),
                "Tool_Magnify".to_string(),
                "Tool_PanBehind".to_string(),
                "Tool_Rect".to_string(),
                "Tool_RoundedRect".to_string(),
                "Tool_Oval".to_string(),
                "Tool_Polygon".to_string(),
                "Tool_Star".to_string(),
                "Tool_TextH".to_string(),
                "Tool_TextV".to_string(),
                "Tool_Pen".to_string(),
                "Tool_Feather".to_string(),
                "Tool_PenPlus".to_string(),
                "Tool_PenMinus".to_string(),
                "Tool_PenConvert".to_string(),
                "Tool_Pin".to_string(),
                "Tool_PinStarch".to_string(),
                "Tool_PinDepth".to_string(),
                "Tool_Quickselect".to_string(),
                "Tool_Hairbrush".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Frames count type
        self.property_group.base.api_object.properties.insert("framesCountType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FramesCountType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "FC_START_1".to_string(),
                "FC_START_0".to_string(),
                "FC_TIMECODE_CONVERSION".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Feet + frames film type
        self.property_group.base.api_object.properties.insert("feetFramesFilmType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FeetFramesFilmType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "MM16".to_string(),
                "MM35".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Use feet + frames setting
        self.property_group.base.api_object.properties.insert("framesUseFeetFrames".to_string(), ValidationRule {
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
        
        // Footage timecode display start type
        self.property_group.base.api_object.properties.insert("footageTimecodeDisplayStartType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("FootageTimecodeDisplayStartType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "FTCS_START_0".to_string(),
                "FTCS_USE_SOURCE_MEDIA".to_string(),
            ]),
            custom_validator: None,
        });
        
        // Linear blending
        self.property_group.base.api_object.properties.insert("linearBlending".to_string(), ValidationRule {
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
        
        // Linearize working space
        self.property_group.base.api_object.properties.insert("linearizeWorkingSpace".to_string(), ValidationRule {
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
        
        // Transparency grid thumbnails
        self.property_group.base.api_object.properties.insert("transparencyGridThumbnails".to_string(), ValidationRule {
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
    
    /// Initialize project settings properties
    fn initialize_project_settings(&mut self) {
        // Color depth (bits per channel)
        self.property_group.base.api_object.properties.insert("bitsPerChannel".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec!["8".to_string(), "16".to_string(), "32".to_string()]),
            custom_validator: None,
        });
        
        // Time display type
        self.property_group.base.api_object.properties.insert("timeDisplayType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("TimeDisplayType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "FRAMES".to_string(),
                "TIMECODE".to_string()
            ]),
            custom_validator: None,
        });
        
        // Working color space
        self.property_group.base.api_object.properties.insert("workingSpace".to_string(), ValidationRule {
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
        
        // Working gamma
        self.property_group.base.api_object.properties.insert("workingGamma".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(3.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec!["1.8".to_string(), "2.2".to_string(), "2.4".to_string()]),
            custom_validator: None,
        });
        
        // Compensate for scene-referred profiles
        self.property_group.base.api_object.properties.insert("compensateForSceneReferredProfiles".to_string(), ValidationRule {
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
        
        // Expression engine
        self.property_group.base.api_object.properties.insert("expressionEngine".to_string(), ValidationRule {
            value_type: PropertyValueType::ArbText,
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "extendscript".to_string(),
                "javascript-1.0".to_string()
            ]),
            custom_validator: None,
        });
        
        // GPU acceleration type
        self.property_group.base.api_object.properties.insert("gpuAccelType".to_string(), ValidationRule {
            value_type: PropertyValueType::Custom("GpuAccelType".to_string()),
            array_size: None,
            range_min: None,
            range_max: None,
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: true,
            allowed_values: Some(vec![
                "GPU_ACCEL_TYPE_CUDA".to_string(),
                "GPU_ACCEL_TYPE_METAL".to_string(),
                "GPU_ACCEL_TYPE_OPENCL".to_string(),
                "GPU_ACCEL_TYPE_SOFTWARE".to_string()
            ]),
            custom_validator: None,
        });
        
        // Linear working space
        self.property_group.base.api_object.properties.insert("linearWorkingSpace".to_string(), ValidationRule {
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
        
        // Display color management
        self.property_group.base.api_object.properties.insert("displayColorManagement".to_string(), ValidationRule {
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
        
        // Auto-save settings
        self.property_group.base.api_object.properties.insert("autoSaveEnabled".to_string(), ValidationRule {
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
        
        self.property_group.base.api_object.properties.insert("autoSaveInterval".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(60.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        // Maximum project versions
        self.property_group.base.api_object.properties.insert("maxVersions".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
    }
    
    /// Initialize core project methods
    fn initialize_project_methods(&mut self) {
        // Project creation and opening
        self.property_group.base.api_object.methods.insert("open".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("openTemplate".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("newFromTemplate".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // Project information and properties
        self.property_group.base.api_object.methods.insert("getProjectInfo".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("setProjectInfo".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Object".to_string())
            ]));
            
        // Layer by ID (After Effects 24.5+)
        self.property_group.base.api_object.methods.insert("layerByID".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::OneD      // layerID
            ]));
            
        // Replace font across project
        self.property_group.base.api_object.methods.insert("replaceFont".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // old font name
                PropertyValueType::ArbText   // new font name
            ]));
            
        // Show/hide project window
        self.property_group.base.api_object.methods.insert("showWindow".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Boolean".to_string())
            ]));
            
        // Window focus control
        self.property_group.base.api_object.methods.insert("activate".to_string(), 
            MethodValidation::new(0));
    }
    
    /// Initialize file operation methods
    fn initialize_file_operations(&mut self) {
        // Save operations
        self.property_group.base.api_object.methods.insert("save".to_string(), 
            MethodValidation::new(0).with_optional_params(vec![
                PropertyValueType::Custom("File".to_string())   // file
            ]));
            
        self.property_group.base.api_object.methods.insert("saveAs".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("saveWithDialog".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("saveAsTemplate".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("File".to_string()),
                PropertyValueType::ArbText  // template name
            ]));
            
        self.property_group.base.api_object.methods.insert("saveACopy".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // Close operations
        self.property_group.base.api_object.methods.insert("close".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("CloseOptions".to_string())
            ]));
            
        // Import operations
        self.property_group.base.api_object.methods.insert("importFile".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("ImportOptions".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("importFileWithDialog".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("importMultipleFiles".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // array of ImportOptions
            ]));
            
        self.property_group.base.api_object.methods.insert("importPlaceholder".to_string(), 
            MethodValidation::new(5).with_param_types(vec![
                PropertyValueType::ArbText,  // name
                PropertyValueType::OneD,     // width
                PropertyValueType::OneD,     // height
                PropertyValueType::OneD,     // frameRate
                PropertyValueType::OneD      // duration
            ]));
            
        self.property_group.base.api_object.methods.insert("importSequence".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // first file in sequence
            ]));
            
        // Export operations
        self.property_group.base.api_object.methods.insert("exportProject".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("File".to_string()),
                PropertyValueType::Custom("ExportOptions".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("exportAAF".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("CompItem".to_string()),
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("exportFinalCutPro".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("CompItem".to_string()),
                PropertyValueType::Custom("File".to_string())
            ]));
            
        // Default import folder
        self.property_group.base.api_object.methods.insert("setDefaultImportFolder".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Folder".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("getDefaultImportFolder".to_string(), 
            MethodValidation::new(0));
    }
    
    /// Initialize item management methods
    fn initialize_item_management(&mut self) {
        // Folder operations
        self.property_group.base.api_object.methods.insert("newFolder".to_string(), 
            MethodValidation::new(0).with_optional_params(vec![
                PropertyValueType::ArbText   // name
            ]));
            
        self.property_group.base.api_object.methods.insert("createFolder".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // name
                PropertyValueType::Custom("FolderItem".to_string())  // parent folder
            ]));
            
        // Item selection and organization
        self.property_group.base.api_object.methods.insert("selectAllItems".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("deselectAllItems".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("selectItems".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // array of items
            ]));
            
        self.property_group.base.api_object.methods.insert("moveToFolder".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),    // items to move
                PropertyValueType::Custom("FolderItem".to_string()) // destination folder
            ]));
            
        // Item duplication and copying
        self.property_group.base.api_object.methods.insert("duplicateItems".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // items to duplicate
            ]));
            
        self.property_group.base.api_object.methods.insert("copyToProject".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string()),     // items to copy
                PropertyValueType::Custom("ProjectObject".to_string()) // destination project
            ]));
            
        // Item search and filtering
        self.property_group.base.api_object.methods.insert("findItemsByName".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // search pattern
            ]));
            
        self.property_group.base.api_object.methods.insert("findItemsByType".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // item type
            ]));
            
        self.property_group.base.api_object.methods.insert("findUnusedItems".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("findMissingFootage".to_string(), 
            MethodValidation::new(0));
            
        // Item replacement and linking
        self.property_group.base.api_object.methods.insert("replaceFootage".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("FootageItem".to_string()),
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("relinkFootage".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("FootageItem".to_string()),
                PropertyValueType::Custom("File".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("collectFiles".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("Folder".to_string()),   // destination folder
                PropertyValueType::Custom("Boolean".to_string())   // copy footage files
            ]));
    }
    
    /// Initialize consolidation and cleanup features
    fn initialize_consolidation_features(&mut self) {
        // Project consolidation
        self.property_group.base.api_object.methods.insert("consolidateFootage".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("removeUnusedFootage".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("reduceProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // items to keep
            ]));
            
        // Project optimization
        self.property_group.base.api_object.methods.insert("optimizeProject".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("compressProject".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("trimProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("Array".to_string())  // compositions to trim
            ]));
            
        // Cleanup operations
        self.property_group.base.api_object.methods.insert("removeEmptyFolders".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("removeDuplicateFootage".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("cleanupProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("CleanupOptions".to_string())
            ]));
            
        // Auto-fix operations
        self.property_group.base.api_object.methods.insert("autoFixExpressions".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // oldText
                PropertyValueType::ArbText   // newText
            ]));
            
        self.property_group.base.api_object.methods.insert("fixBrokenReferences".to_string(), 
            MethodValidation::new(0));
            
        // Collection features
        self.property_group.base.api_object.methods.insert("createCollection".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // collection name
                PropertyValueType::Custom("Array".to_string())  // items
            ]));
            
        self.property_group.base.api_object.methods.insert("addToCollection".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // collection name
                PropertyValueType::Custom("Array".to_string())  // items to add
            ]));
    }
    
    /// Initialize backup and recovery features
    fn initialize_backup_recovery(&mut self) {
        // Auto-save and backup
        self.property_group.base.api_object.methods.insert("enableAutoSave".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::OneD  // interval in minutes
            ]));
            
        self.property_group.base.api_object.methods.insert("disableAutoSave".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("createBackup".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // backup location
            ]));
            
        self.property_group.base.api_object.methods.insert("restoreFromBackup".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // backup file
            ]));
            
        // Version control
        self.property_group.base.api_object.methods.insert("createVersion".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // version comment
            ]));
            
        self.property_group.base.api_object.methods.insert("listVersions".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("revertToVersion".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::OneD  // version number
            ]));
            
        // Recovery operations
        self.property_group.base.api_object.methods.insert("recoverProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // recovery file
            ]));
            
        self.property_group.base.api_object.methods.insert("checkProjectIntegrity".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("repairProject".to_string(), 
            MethodValidation::new(0));
    }
    
    /// Initialize templates and presets
    fn initialize_templates_presets(&mut self) {
        // Template operations
        self.property_group.base.api_object.methods.insert("listProjectTemplates".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("applyTemplate".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // template file
            ]));
            
        self.property_group.base.api_object.methods.insert("createTemplateFromProject".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::Custom("File".to_string()),  // template file
                PropertyValueType::Custom("TemplateOptions".to_string())
            ]));
            
        // Preset management
        self.property_group.base.api_object.methods.insert("saveProjectPreset".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // preset name
                PropertyValueType::Custom("PresetOptions".to_string())
            ]));
            
        self.property_group.base.api_object.methods.insert("loadProjectPreset".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // preset name
            ]));
            
        self.property_group.base.api_object.methods.insert("listProjectPresets".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("deleteProjectPreset".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // preset name
            ]));
            
        // Factory methods for project creation
        self.property_group.base.api_object.methods.insert("createHDProject".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("create4KProject".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("createCustomProject".to_string(), 
            MethodValidation::new(3).with_param_types(vec![
                PropertyValueType::OneD,  // width
                PropertyValueType::OneD,  // height
                PropertyValueType::OneD   // frame rate
            ]));
            
        self.property_group.base.api_object.methods.insert("createFromTemplate".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // template name
            ]));
            
        // Color profile management
        self.property_group.base.api_object.methods.insert("listColorProfiles".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("setColorProfile".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText  // profile name
            ]));
            
        self.property_group.base.api_object.methods.insert("getColorProfile".to_string(), 
            MethodValidation::new(0));
    }
    
    /// Access to the underlying PropertyGroup
    pub fn get_property_group(&self) -> &PropertyGroup {
        &self.property_group
    }
    
    /// Mutable access to the underlying PropertyGroup
    pub fn get_property_group_mut(&mut self) -> &mut PropertyGroup {
        &mut self.property_group
    }
    
    /// Factory method to create a new empty project
    pub fn create_new_project() -> Self {
        let mut project = Self::new();
        
        // Set default project settings
        project.property_group.base.api_object.properties.insert("frameRate".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1.0),
            range_max: Some(99.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        project
    }
    
    /// Factory method to create an HD project (1920x1080)
    pub fn create_hd_project() -> Self {
        let mut project = Self::create_new_project();
        
        // Set HD-specific properties
        project.property_group.base.api_object.properties.insert("width".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1920.0),
            range_max: Some(1920.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        project.property_group.base.api_object.properties.insert("height".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(1080.0),
            range_max: Some(1080.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        project
    }
    
    /// Factory method to create a 4K project (3840x2160)
    pub fn create_4k_project() -> Self {
        let mut project = Self::create_new_project();
        
        // Set 4K-specific properties
        project.property_group.base.api_object.properties.insert("width".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(3840.0),
            range_max: Some(3840.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        project.property_group.base.api_object.properties.insert("height".to_string(), ValidationRule {
            value_type: PropertyValueType::OneD,
            array_size: None,
            range_min: Some(2160.0),
            range_max: Some(2160.0),
            is_spatial: false,
            can_vary_over_time: false,
            dimensions_separated: false,
            is_dropdown: false,
            allowed_values: None,
            custom_validator: None,
        });
        
        project
    }
    
    /// Initialize team projects functionality (After Effects 14.2+)
    fn initialize_team_projects(&mut self) {
        // Team project creation
        self.property_group.base.api_object.methods.insert("newTeamProject".to_string(), 
            MethodValidation::new(2).with_param_types(vec![
                PropertyValueType::ArbText,  // teamProjectName
                PropertyValueType::ArbText   // description (optional)
            ]));
            
        // Team project opening
        self.property_group.base.api_object.methods.insert("openTeamProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText   // teamProjectName
            ]));
            
        // Team project sharing
        self.property_group.base.api_object.methods.insert("shareTeamProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText   // comment (optional)
            ]));
            
        // Team project syncing
        self.property_group.base.api_object.methods.insert("syncTeamProject".to_string(), 
            MethodValidation::new(0));
            
        // Team project closing
        self.property_group.base.api_object.methods.insert("closeTeamProject".to_string(), 
            MethodValidation::new(0));
            
        // Team project conversion
        self.property_group.base.api_object.methods.insert("convertTeamProjectToProject".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("File".to_string())  // project_file
            ]));
            
        // Team project listing
        self.property_group.base.api_object.methods.insert("listTeamProjects".to_string(), 
            MethodValidation::new(0));
            
        // Team project status checks
        self.property_group.base.api_object.methods.insert("isTeamProjectOpen".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::ArbText   // teamProjectName
            ]));
            
        self.property_group.base.api_object.methods.insert("isAnyTeamProjectOpen".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("isTeamProjectEnabled".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("isLoggedInToTeamProject".to_string(), 
            MethodValidation::new(0));
            
        // Team project command status
        self.property_group.base.api_object.methods.insert("isSyncCommandEnabled".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("isShareCommandEnabled".to_string(), 
            MethodValidation::new(0));
            
        self.property_group.base.api_object.methods.insert("isResolveCommandEnabled".to_string(), 
            MethodValidation::new(0));
            
        // Team project conflict resolution
        self.property_group.base.api_object.methods.insert("resolveConflict".to_string(), 
            MethodValidation::new(1).with_param_types(vec![
                PropertyValueType::Custom("ResolveType".to_string())  // ResolveType
            ]));
    }
    
    /// Comprehensive validation for project operations
    pub fn validate_project_operation(&self, operation: &str) -> Result<(), String> {
        match operation {
            "save" => {
                // Check if project has unsaved changes
                Ok(())
            },
            "close" => {
                // Check if project can be closed safely
                Ok(())
            },
            "export" => {
                // Validate export requirements
                Ok(())
            },
            _ => Err(format!("Unknown project operation: {}", operation))
        }
    }
}

impl ProjectCloseOptions {
    pub fn to_string(&self) -> String {
        match self {
            ProjectCloseOptions::SaveChanges => "SAVE_CHANGES".to_string(),
            ProjectCloseOptions::DoNotSaveChanges => "DO_NOT_SAVE_CHANGES".to_string(),
            ProjectCloseOptions::PromptToSaveChanges => "PROMPT_TO_SAVE_CHANGES".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectCloseOptions> {
        match value {
            "SAVE_CHANGES" => Some(ProjectCloseOptions::SaveChanges),
            "DO_NOT_SAVE_CHANGES" => Some(ProjectCloseOptions::DoNotSaveChanges),
            "PROMPT_TO_SAVE_CHANGES" => Some(ProjectCloseOptions::PromptToSaveChanges),
            _ => None,
        }
    }
}

impl ProjectFileType {
    pub fn to_string(&self) -> String {
        match self {
            ProjectFileType::AEP => "aep".to_string(),
            ProjectFileType::AEPX => "aepx".to_string(),
            ProjectFileType::AET => "aet".to_string(),
            ProjectFileType::AETX => "aetx".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectFileType> {
        match value.to_lowercase().as_str() {
            "aep" => Some(ProjectFileType::AEP),
            "aepx" => Some(ProjectFileType::AEPX),
            "aet" => Some(ProjectFileType::AET),
            "aetx" => Some(ProjectFileType::AETX),
            _ => None,
        }
    }
}

impl ProjectColorDepth {
    pub fn to_string(&self) -> String {
        match self {
            ProjectColorDepth::Depth8Bit => "8".to_string(),
            ProjectColorDepth::Depth16Bit => "16".to_string(),
            ProjectColorDepth::Depth32Bit => "32".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectColorDepth> {
        match value {
            "8" => Some(ProjectColorDepth::Depth8Bit),
            "16" => Some(ProjectColorDepth::Depth16Bit),
            "32" => Some(ProjectColorDepth::Depth32Bit),
            _ => None,
        }
    }
}

impl ProjectTimeDisplayType {
    pub fn to_string(&self) -> String {
        match self {
            ProjectTimeDisplayType::Frames => "FRAMES".to_string(),
            ProjectTimeDisplayType::Timecode => "TIMECODE".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectTimeDisplayType> {
        match value {
            "FRAMES" => Some(ProjectTimeDisplayType::Frames),
            "TIMECODE" => Some(ProjectTimeDisplayType::Timecode),
            _ => None,
        }
    }
}

impl ProjectGpuAccelType {
    pub fn to_string(&self) -> String {
        match self {
            ProjectGpuAccelType::Cuda => "GPU_ACCEL_TYPE_CUDA".to_string(),
            ProjectGpuAccelType::Metal => "GPU_ACCEL_TYPE_METAL".to_string(),
            ProjectGpuAccelType::OpenCL => "GPU_ACCEL_TYPE_OPENCL".to_string(),
            ProjectGpuAccelType::Software => "GPU_ACCEL_TYPE_SOFTWARE".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectGpuAccelType> {
        match value {
            "GPU_ACCEL_TYPE_CUDA" => Some(ProjectGpuAccelType::Cuda),
            "GPU_ACCEL_TYPE_METAL" => Some(ProjectGpuAccelType::Metal),
            "GPU_ACCEL_TYPE_OPENCL" => Some(ProjectGpuAccelType::OpenCL),
            "GPU_ACCEL_TYPE_SOFTWARE" => Some(ProjectGpuAccelType::Software),
            _ => None,
        }
    }
}

impl ProjectExpressionEngine {
    pub fn to_string(&self) -> String {
        match self {
            ProjectExpressionEngine::ExtendScript => "extendscript".to_string(),
            ProjectExpressionEngine::JavaScript10 => "javascript-1.0".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ProjectExpressionEngine> {
        match value {
            "extendscript" => Some(ProjectExpressionEngine::ExtendScript),
            "javascript-1.0" => Some(ProjectExpressionEngine::JavaScript10),
            _ => None,
        }
    }
}

// Additional enum implementations for comprehensive API coverage
impl FramesCountType {
    pub fn to_string(&self) -> String {
        match self {
            FramesCountType::FC_START_1 => "FC_START_1".to_string(),
            FramesCountType::FC_START_0 => "FC_START_0".to_string(),
            FramesCountType::FC_TIMECODE_CONVERSION => "FC_TIMECODE_CONVERSION".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<FramesCountType> {
        match value {
            "FC_START_1" => Some(FramesCountType::FC_START_1),
            "FC_START_0" => Some(FramesCountType::FC_START_0),
            "FC_TIMECODE_CONVERSION" => Some(FramesCountType::FC_TIMECODE_CONVERSION),
            _ => None,
        }
    }
}

impl FeetFramesFilmType {
    pub fn to_string(&self) -> String {
        match self {
            FeetFramesFilmType::MM16 => "MM16".to_string(),
            FeetFramesFilmType::MM35 => "MM35".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<FeetFramesFilmType> {
        match value {
            "MM16" => Some(FeetFramesFilmType::MM16),
            "MM35" => Some(FeetFramesFilmType::MM35),
            _ => None,
        }
    }
}

impl FootageTimecodeDisplayStartType {
    pub fn to_string(&self) -> String {
        match self {
            FootageTimecodeDisplayStartType::FTCS_START_0 => "FTCS_START_0".to_string(),
            FootageTimecodeDisplayStartType::FTCS_USE_SOURCE_MEDIA => "FTCS_USE_SOURCE_MEDIA".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<FootageTimecodeDisplayStartType> {
        match value {
            "FTCS_START_0" => Some(FootageTimecodeDisplayStartType::FTCS_START_0),
            "FTCS_USE_SOURCE_MEDIA" => Some(FootageTimecodeDisplayStartType::FTCS_USE_SOURCE_MEDIA),
            _ => None,
        }
    }
}

impl ToolType {
    pub fn to_string(&self) -> String {
        match self {
            ToolType::Tool_Arrow => "Tool_Arrow".to_string(),
            ToolType::Tool_Rotate => "Tool_Rotate".to_string(),
            ToolType::Tool_CameraMaya => "Tool_CameraMaya".to_string(),
            ToolType::Tool_CameraOrbit => "Tool_CameraOrbit".to_string(),
            ToolType::Tool_CameraTrackXY => "Tool_CameraTrackXY".to_string(),
            ToolType::Tool_CameraTrackZ => "Tool_CameraTrackZ".to_string(),
            ToolType::Tool_Paintbrush => "Tool_Paintbrush".to_string(),
            ToolType::Tool_CloneStamp => "Tool_CloneStamp".to_string(),
            ToolType::Tool_Eraser => "Tool_Eraser".to_string(),
            ToolType::Tool_Hand => "Tool_Hand".to_string(),
            ToolType::Tool_Magnify => "Tool_Magnify".to_string(),
            ToolType::Tool_PanBehind => "Tool_PanBehind".to_string(),
            ToolType::Tool_Rect => "Tool_Rect".to_string(),
            ToolType::Tool_RoundedRect => "Tool_RoundedRect".to_string(),
            ToolType::Tool_Oval => "Tool_Oval".to_string(),
            ToolType::Tool_Polygon => "Tool_Polygon".to_string(),
            ToolType::Tool_Star => "Tool_Star".to_string(),
            ToolType::Tool_TextH => "Tool_TextH".to_string(),
            ToolType::Tool_TextV => "Tool_TextV".to_string(),
            ToolType::Tool_Pen => "Tool_Pen".to_string(),
            ToolType::Tool_Feather => "Tool_Feather".to_string(),
            ToolType::Tool_PenPlus => "Tool_PenPlus".to_string(),
            ToolType::Tool_PenMinus => "Tool_PenMinus".to_string(),
            ToolType::Tool_PenConvert => "Tool_PenConvert".to_string(),
            ToolType::Tool_Pin => "Tool_Pin".to_string(),
            ToolType::Tool_PinStarch => "Tool_PinStarch".to_string(),
            ToolType::Tool_PinDepth => "Tool_PinDepth".to_string(),
            ToolType::Tool_Quickselect => "Tool_Quickselect".to_string(),
            ToolType::Tool_Hairbrush => "Tool_Hairbrush".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ToolType> {
        match value {
            "Tool_Arrow" => Some(ToolType::Tool_Arrow),
            "Tool_Rotate" => Some(ToolType::Tool_Rotate),
            "Tool_CameraMaya" => Some(ToolType::Tool_CameraMaya),
            "Tool_CameraOrbit" => Some(ToolType::Tool_CameraOrbit),
            "Tool_CameraTrackXY" => Some(ToolType::Tool_CameraTrackXY),
            "Tool_CameraTrackZ" => Some(ToolType::Tool_CameraTrackZ),
            "Tool_Paintbrush" => Some(ToolType::Tool_Paintbrush),
            "Tool_CloneStamp" => Some(ToolType::Tool_CloneStamp),
            "Tool_Eraser" => Some(ToolType::Tool_Eraser),
            "Tool_Hand" => Some(ToolType::Tool_Hand),
            "Tool_Magnify" => Some(ToolType::Tool_Magnify),
            "Tool_PanBehind" => Some(ToolType::Tool_PanBehind),
            "Tool_Rect" => Some(ToolType::Tool_Rect),
            "Tool_RoundedRect" => Some(ToolType::Tool_RoundedRect),
            "Tool_Oval" => Some(ToolType::Tool_Oval),
            "Tool_Polygon" => Some(ToolType::Tool_Polygon),
            "Tool_Star" => Some(ToolType::Tool_Star),
            "Tool_TextH" => Some(ToolType::Tool_TextH),
            "Tool_TextV" => Some(ToolType::Tool_TextV),
            "Tool_Pen" => Some(ToolType::Tool_Pen),
            "Tool_Feather" => Some(ToolType::Tool_Feather),
            "Tool_PenPlus" => Some(ToolType::Tool_PenPlus),
            "Tool_PenMinus" => Some(ToolType::Tool_PenMinus),
            "Tool_PenConvert" => Some(ToolType::Tool_PenConvert),
            "Tool_Pin" => Some(ToolType::Tool_Pin),
            "Tool_PinStarch" => Some(ToolType::Tool_PinStarch),
            "Tool_PinDepth" => Some(ToolType::Tool_PinDepth),
            "Tool_Quickselect" => Some(ToolType::Tool_Quickselect),
            "Tool_Hairbrush" => Some(ToolType::Tool_Hairbrush),
            _ => None,
        }
    }
}

impl ResolveType {
    pub fn to_string(&self) -> String {
        match self {
            ResolveType::ACCEPT_THEIRS => "ACCEPT_THEIRS".to_string(),
            ResolveType::ACCEPT_YOURS => "ACCEPT_YOURS".to_string(),
            ResolveType::ACCEPT_THEIRS_AND_COPY => "ACCEPT_THEIRS_AND_COPY".to_string(),
        }
    }
    
    pub fn from_string(value: &str) -> Option<ResolveType> {
        match value {
            "ACCEPT_THEIRS" => Some(ResolveType::ACCEPT_THEIRS),
            "ACCEPT_YOURS" => Some(ResolveType::ACCEPT_YOURS),
            "ACCEPT_THEIRS_AND_COPY" => Some(ResolveType::ACCEPT_THEIRS_AND_COPY),
            _ => None,
        }
    }
}

// Comprehensive tests for the Project system
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_project_creation() {
        let project = ProjectObject::new();
        assert!(project.property_group.base.api_object.properties.contains_key("file"));
        assert!(project.property_group.base.api_object.properties.contains_key("dirty"));
        assert!(project.property_group.base.api_object.properties.contains_key("items"));
    }

    #[test]
    fn test_project_factory_methods() {
        let hd_project = ProjectObject::create_hd_project();
        assert!(hd_project.property_group.base.api_object.properties.contains_key("width"));
        assert!(hd_project.property_group.base.api_object.properties.contains_key("height"));

        let fourk_project = ProjectObject::create_4k_project();
        assert!(fourk_project.property_group.base.api_object.properties.contains_key("width"));
        assert!(fourk_project.property_group.base.api_object.properties.contains_key("height"));
    }

    #[test]
    fn test_project_methods() {
        let project = ProjectObject::new();
        
        // Test that key methods are available
        assert!(project.property_group.base.api_object.methods.contains_key("save"));
        assert!(project.property_group.base.api_object.methods.contains_key("close"));
        assert!(project.property_group.base.api_object.methods.contains_key("importFile"));
        assert!(project.property_group.base.api_object.methods.contains_key("newFolder"));
        assert!(project.property_group.base.api_object.methods.contains_key("consolidateFootage"));
        
        // Test team project methods
        assert!(project.property_group.base.api_object.methods.contains_key("newTeamProject"));
        assert!(project.property_group.base.api_object.methods.contains_key("openTeamProject"));
        assert!(project.property_group.base.api_object.methods.contains_key("shareTeamProject"));
        assert!(project.property_group.base.api_object.methods.contains_key("syncTeamProject"));
        
        // Test newer methods
        assert!(project.property_group.base.api_object.methods.contains_key("layerByID"));
        assert!(project.property_group.base.api_object.methods.contains_key("replaceFont"));
    }

    #[test]
    fn test_project_settings() {
        let project = ProjectObject::new();
        
        // Test project settings properties
        assert!(project.property_group.base.api_object.properties.contains_key("bitsPerChannel"));
        assert!(project.property_group.base.api_object.properties.contains_key("timeDisplayType"));
        assert!(project.property_group.base.api_object.properties.contains_key("workingSpace"));
        assert!(project.property_group.base.api_object.properties.contains_key("expressionEngine"));
        
        // Test additional properties
        assert!(project.property_group.base.api_object.properties.contains_key("numItems"));
        assert!(project.property_group.base.api_object.properties.contains_key("revision"));
        assert!(project.property_group.base.api_object.properties.contains_key("displayStartFrame"));
        assert!(project.property_group.base.api_object.properties.contains_key("toolType"));
        assert!(project.property_group.base.api_object.properties.contains_key("framesCountType"));
        assert!(project.property_group.base.api_object.properties.contains_key("usedFonts"));
    }

    #[test]
    fn test_file_operations() {
        let project = ProjectObject::new();
        
        // Test file operation methods
        assert!(project.property_group.base.api_object.methods.contains_key("save"));
        assert!(project.property_group.base.api_object.methods.contains_key("saveAs"));
        assert!(project.property_group.base.api_object.methods.contains_key("open"));
        assert!(project.property_group.base.api_object.methods.contains_key("importFile"));
        assert!(project.property_group.base.api_object.methods.contains_key("exportProject"));
    }

    #[test]
    fn test_item_management() {
        let project = ProjectObject::new();
        
        // Test item management methods
        assert!(project.property_group.base.api_object.methods.contains_key("newFolder"));
        assert!(project.property_group.base.api_object.methods.contains_key("selectAllItems"));
        assert!(project.property_group.base.api_object.methods.contains_key("findItemsByName"));
        assert!(project.property_group.base.api_object.methods.contains_key("duplicateItems"));
    }

    #[test]
    fn test_consolidation_features() {
        let project = ProjectObject::new();
        
        // Test consolidation methods
        assert!(project.property_group.base.api_object.methods.contains_key("consolidateFootage"));
        assert!(project.property_group.base.api_object.methods.contains_key("removeUnusedFootage"));
        assert!(project.property_group.base.api_object.methods.contains_key("reduceProject"));
        assert!(project.property_group.base.api_object.methods.contains_key("autoFixExpressions"));
    }

    #[test]
    fn test_backup_recovery() {
        let project = ProjectObject::new();
        
        // Test backup and recovery methods
        assert!(project.property_group.base.api_object.methods.contains_key("enableAutoSave"));
        assert!(project.property_group.base.api_object.methods.contains_key("createBackup"));
        assert!(project.property_group.base.api_object.methods.contains_key("createVersion"));
        assert!(project.property_group.base.api_object.methods.contains_key("recoverProject"));
    }

    #[test]
    fn test_templates_presets() {
        let project = ProjectObject::new();
        
        // Test template and preset methods
        assert!(project.property_group.base.api_object.methods.contains_key("listProjectTemplates"));
        assert!(project.property_group.base.api_object.methods.contains_key("saveProjectPreset"));
        assert!(project.property_group.base.api_object.methods.contains_key("createHDProject"));
        assert!(project.property_group.base.api_object.methods.contains_key("create4KProject"));
    }

    #[test]
    fn test_project_enums() {
        // Test ProjectCloseOptions
        let close_option = ProjectCloseOptions::SaveChanges;
        assert_eq!(close_option.to_string(), "SAVE_CHANGES");
        assert_eq!(ProjectCloseOptions::from_string("SAVE_CHANGES"), Some(ProjectCloseOptions::SaveChanges));

        // Test ProjectFileType
        let file_type = ProjectFileType::AEP;
        assert_eq!(file_type.to_string(), "aep");
        assert_eq!(ProjectFileType::from_string("aep"), Some(ProjectFileType::AEP));

        // Test ProjectColorDepth
        let color_depth = ProjectColorDepth::Depth16Bit;
        assert_eq!(color_depth.to_string(), "16");
        assert_eq!(ProjectColorDepth::from_string("16"), Some(ProjectColorDepth::Depth16Bit));

        // Test ProjectTimeDisplayType
        let time_display = ProjectTimeDisplayType::Timecode;
        assert_eq!(time_display.to_string(), "TIMECODE");
        assert_eq!(ProjectTimeDisplayType::from_string("TIMECODE"), Some(ProjectTimeDisplayType::Timecode));

        // Test ProjectGpuAccelType
        let gpu_accel = ProjectGpuAccelType::Metal;
        assert_eq!(gpu_accel.to_string(), "GPU_ACCEL_TYPE_METAL");
        assert_eq!(ProjectGpuAccelType::from_string("GPU_ACCEL_TYPE_METAL"), Some(ProjectGpuAccelType::Metal));

        // Test ProjectExpressionEngine
        let expr_engine = ProjectExpressionEngine::JavaScript10;
        assert_eq!(expr_engine.to_string(), "javascript-1.0");
        assert_eq!(ProjectExpressionEngine::from_string("javascript-1.0"), Some(ProjectExpressionEngine::JavaScript10));
    }
    
    #[test]
    fn test_new_project_enums() {
        // Test FramesCountType
        let frames_count = FramesCountType::FC_START_1;
        assert_eq!(frames_count.to_string(), "FC_START_1");
        assert_eq!(FramesCountType::from_string("FC_START_1"), Some(FramesCountType::FC_START_1));
        
        // Test FeetFramesFilmType
        let feet_frames = FeetFramesFilmType::MM35;
        assert_eq!(feet_frames.to_string(), "MM35");
        assert_eq!(FeetFramesFilmType::from_string("MM35"), Some(FeetFramesFilmType::MM35));
        
        // Test FootageTimecodeDisplayStartType
        let timecode_start = FootageTimecodeDisplayStartType::FTCS_USE_SOURCE_MEDIA;
        assert_eq!(timecode_start.to_string(), "FTCS_USE_SOURCE_MEDIA");
        assert_eq!(FootageTimecodeDisplayStartType::from_string("FTCS_USE_SOURCE_MEDIA"), Some(FootageTimecodeDisplayStartType::FTCS_USE_SOURCE_MEDIA));
        
        // Test ToolType
        let tool = ToolType::Tool_CameraMaya;
        assert_eq!(tool.to_string(), "Tool_CameraMaya");
        assert_eq!(ToolType::from_string("Tool_CameraMaya"), Some(ToolType::Tool_CameraMaya));
        
        // Test ResolveType
        let resolve = ResolveType::ACCEPT_THEIRS_AND_COPY;
        assert_eq!(resolve.to_string(), "ACCEPT_THEIRS_AND_COPY");
        assert_eq!(ResolveType::from_string("ACCEPT_THEIRS_AND_COPY"), Some(ResolveType::ACCEPT_THEIRS_AND_COPY));
    }
    
    #[test]
    fn test_team_projects_comprehensive() {
        let project = ProjectObject::new();
        
        // Test all team project methods
        let team_methods = vec![
            "newTeamProject", "openTeamProject", "shareTeamProject", "syncTeamProject",
            "closeTeamProject", "convertTeamProjectToProject", "listTeamProjects",
            "isTeamProjectOpen", "isAnyTeamProjectOpen", "isTeamProjectEnabled",
            "isLoggedInToTeamProject", "isSyncCommandEnabled", "isShareCommandEnabled",
            "isResolveCommandEnabled", "resolveConflict"
        ];
        
        for method in team_methods {
            assert!(project.property_group.base.api_object.methods.contains_key(method),
                   "Missing team project method: {}", method);
        }
    }

    #[test]
    fn test_project_validation() {
        let project = ProjectObject::new();
        
        // Test valid operations
        assert!(project.validate_project_operation("save").is_ok());
        assert!(project.validate_project_operation("close").is_ok());
        assert!(project.validate_project_operation("export").is_ok());
        
        // Test invalid operation
        assert!(project.validate_project_operation("invalid_op").is_err());
    }

    #[test]
    fn test_inheritance_chain() {
        let project = ProjectObject::new();
        
        // Test that PropertyBase properties are inherited
        assert!(project.property_group.base.api_object.properties.contains_key("name"));
        assert!(project.property_group.base.api_object.properties.contains_key("matchName"));
        assert!(project.property_group.base.api_object.properties.contains_key("selected"));
        
        // Test that PropertyGroup properties are inherited
        assert!(project.property_group.base.api_object.properties.contains_key("numProperties"));
        
        // Test that PropertyBase methods are inherited
        assert!(project.property_group.base.api_object.methods.contains_key("duplicate"));
        assert!(project.property_group.base.api_object.methods.contains_key("propertyGroup"));
        
        // Test that PropertyGroup methods are inherited
        assert!(project.property_group.base.api_object.methods.contains_key("addProperty"));
        assert!(project.property_group.base.api_object.methods.contains_key("property"));
    }

    #[test]
    fn test_project_comprehensive_coverage() {
        let project = ProjectObject::new();
        
        // Verify comprehensive method coverage including new ones
        let expected_methods = vec![
            // File operations
            "save", "saveAs", "saveWithDialog", "close", "importFile", "exportProject",
            // Item management
            "newFolder", "selectAllItems", "findItemsByName", "duplicateItems",
            // Consolidation
            "consolidateFootage", "removeUnusedFootage", "reduceProject",
            // Newer methods
            "layerByID", "replaceFont", "autoFixExpressions", "showWindow",
            // Team projects
            "newTeamProject", "openTeamProject", "shareTeamProject", "syncTeamProject",
        ];
        
        for method in expected_methods {
            assert!(project.property_group.base.api_object.methods.contains_key(method),
                   "Missing method: {}", method);
        }
        
        // Verify comprehensive property coverage including new ones
        let expected_properties = vec![
            "file", "dirty", "activeItem", "items", "renderQueue",
            "bitsPerChannel", "timeDisplayType", "workingSpace", "expressionEngine",
            "frameRate", "duration", "xmpPacket", "numItems", "revision",
            "displayStartFrame", "toolType", "framesCountType", "feetFramesFilmType",
            "framesUseFeetFrames", "footageTimecodeDisplayStartType", "usedFonts",
            "linearBlending", "linearizeWorkingSpace", "transparencyGridThumbnails"
        ];
        
        for property in expected_properties {
            assert!(project.property_group.base.api_object.properties.contains_key(property),
                   "Missing property: {}", property);
        }
    }
}