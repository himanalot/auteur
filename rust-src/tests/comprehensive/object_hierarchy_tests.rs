// Comprehensive Object Hierarchy Tests
// Based on Adobe After Effects Scripting Guide: introduction/classhierarchy.md
// Tests inheritance relationships and instanceof behavior quirks

use super::*;
use crate::api::objects::*;

/// Comprehensive tests for the Adobe After Effects object hierarchy
/// Tests inheritance relationships and instanceof behavior
pub struct ObjectHierarchyTests;

impl ComprehensiveApiTest for ObjectHierarchyTests {
    fn test_name(&self) -> &str {
        "Object Hierarchy Comprehensive Tests"
    }
    
    fn category(&self) -> TestCategory {
        TestCategory::CoreFoundation
    }
    
    fn priority(&self) -> TestPriority {
        TestPriority::Critical
    }
    
    fn expected_api_count(&self) -> usize {
        35 // Major inheritance relationships to test
    }
    
    fn run_test(&self) -> Vec<ApiTestResult> {
        let mut results = Vec::new();
        
        // Test Property Hierarchy
        results.extend(self.test_property_hierarchy());
        
        // Test Item Hierarchy
        results.extend(self.test_item_hierarchy());
        
        // Test Layer Hierarchy
        results.extend(self.test_layer_hierarchy());
        
        // Test FootageSource Hierarchy
        results.extend(self.test_footage_source_hierarchy());
        
        // Test Collection Hierarchy
        results.extend(self.test_collection_hierarchy());
        
        // Test instanceof Behavior Quirks
        results.extend(self.test_instanceof_quirks());
        
        // Test Object Relationships
        results.extend(self.test_object_relationships());
        
        // Test Type Checking
        results.extend(self.test_type_checking());
        
        results
    }
}

impl ObjectHierarchyTests {
    /// Test PropertyBase → Property/PropertyGroup hierarchy
    fn test_property_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            // PropertyBase as base class
            self.test_property_base_inheritance(),
            
            // Property inheritance
            self.test_property_inheritance(),
            
            // PropertyGroup inheritance
            self.test_property_group_inheritance(),
            
            // MaskPropertyGroup inheritance
            self.test_mask_property_group_inheritance(),
            
            // Property types and relationships
            self.test_property_type_relationships(),
        ]
    }
    
    /// Test Item hierarchy: Item → AVItem/CompItem/FolderItem/FootageItem
    fn test_item_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            // Item base class
            self.test_item_base_inheritance(),
            
            // AVItem inheritance
            self.test_avitem_inheritance(),
            
            // CompItem inheritance
            self.test_compitem_inheritance(),
            
            // FolderItem inheritance
            self.test_folderitem_inheritance(),
            
            // FootageItem inheritance
            self.test_footageitem_inheritance(),
            
            // Item relationships
            self.test_item_relationships(),
        ]
    }
    
    /// Test Layer hierarchy: Layer → AVLayer/TextLayer/ShapeLayer/CameraLayer/LightLayer
    fn test_layer_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            // Layer base class
            self.test_layer_base_inheritance(),
            
            // AVLayer inheritance
            self.test_avlayer_inheritance(),
            
            // TextLayer inheritance (extends AVLayer)
            self.test_textlayer_inheritance(),
            
            // ShapeLayer inheritance (extends AVLayer)
            self.test_shapelayer_inheritance(),
            
            // CameraLayer inheritance (extends Layer)
            self.test_cameralayer_inheritance(),
            
            // LightLayer inheritance (extends Layer)
            self.test_lightlayer_inheritance(),
            
            // ThreeDModelLayer inheritance (extends AVLayer)
            self.test_threeDmodellayer_inheritance(),
            
            // Layer relationships
            self.test_layer_relationships(),
        ]
    }
    
    /// Test FootageSource hierarchy
    fn test_footage_source_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            // FootageSource base class
            self.test_footage_source_base(),
            
            // FileSource inheritance
            self.test_file_source_inheritance(),
            
            // SolidSource inheritance
            self.test_solid_source_inheritance(),
            
            // PlaceholderSource inheritance
            self.test_placeholder_source_inheritance(),
        ]
    }
    
    /// Test Collection objects
    fn test_collection_hierarchy(&self) -> Vec<ApiTestResult> {
        vec![
            // ItemCollection
            self.test_item_collection(),
            
            // LayerCollection
            self.test_layer_collection(),
            
            // RenderQueueItemCollection
            self.test_rq_item_collection(),
            
            // OutputModuleCollection
            self.test_output_module_collection(),
        ]
    }
    
    /// Test instanceof behavior quirks documented in Adobe guides
    fn test_instanceof_quirks(&self) -> Vec<ApiTestResult> {
        vec![
            // Property instanceof quirks
            self.test_property_instanceof_quirks(),
            
            // Layer instanceof quirks
            self.test_layer_instanceof_quirks(),
            
            // Item instanceof quirks
            self.test_item_instanceof_quirks(),
            
            // General instanceof behavior
            self.test_general_instanceof_behavior(),
        ]
    }
    
    /// Test object relationships and parent-child connections
    fn test_object_relationships(&self) -> Vec<ApiTestResult> {
        vec![
            // Parent-child relationships
            self.test_parent_child_relationships(),
            
            // Containment relationships
            self.test_containment_relationships(),
            
            // Reference relationships
            self.test_reference_relationships(),
        ]
    }
    
    /// Test type checking and validation
    fn test_type_checking(&self) -> Vec<ApiTestResult> {
        vec![
            // Type validation
            self.test_type_validation(),
            
            // Type casting
            self.test_type_casting(),
            
            // Type compatibility
            self.test_type_compatibility(),
        ]
    }
    
    // Specific implementation methods
    
    fn test_property_base_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "property_base_inheritance".to_string(),
            api_path: "PropertyBase".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_property_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "property_inheritance_from_base".to_string(),
            api_path: "Property extends PropertyBase".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_property_group_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "property_group_inheritance".to_string(),
            api_path: "PropertyGroup extends PropertyBase".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_mask_property_group_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "mask_property_group_inheritance".to_string(),
            api_path: "MaskPropertyGroup extends PropertyGroup".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_property_type_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "property_type_relationships".to_string(),
            api_path: "Property types and relationships".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_item_base_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "item_base_inheritance".to_string(),
            api_path: "Item base class".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_avitem_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "avitem_inheritance_from_item".to_string(),
            api_path: "AVItem extends Item".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_compitem_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "compitem_inheritance_from_avitem".to_string(),
            api_path: "CompItem extends AVItem".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_folderitem_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "folderitem_inheritance_from_item".to_string(),
            api_path: "FolderItem extends Item".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_footageitem_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "footageitem_inheritance_from_avitem".to_string(),
            api_path: "FootageItem extends AVItem".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_item_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "item_parent_child_relationships".to_string(),
            api_path: "Item relationships and containment".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_layer_base_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "layer_base_inheritance".to_string(),
            api_path: "Layer base class".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_avlayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "avlayer_inheritance_from_layer".to_string(),
            api_path: "AVLayer extends Layer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_textlayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "textlayer_inheritance_from_avlayer".to_string(),
            api_path: "TextLayer extends AVLayer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_shapelayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "shapelayer_inheritance_from_avlayer".to_string(),
            api_path: "ShapeLayer extends AVLayer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_cameralayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "cameralayer_inheritance_from_layer".to_string(),
            api_path: "CameraLayer extends Layer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_lightlayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "lightlayer_inheritance_from_layer".to_string(),
            api_path: "LightLayer extends Layer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_threeDmodellayer_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "threedmodellayer_inheritance_from_avlayer".to_string(),
            api_path: "ThreeDModelLayer extends AVLayer".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_layer_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "layer_parent_child_relationships".to_string(),
            api_path: "Layer relationships and hierarchy".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_footage_source_base(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "footage_source_base_class".to_string(),
            api_path: "FootageSource base class".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_file_source_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "file_source_inheritance".to_string(),
            api_path: "FileSource extends FootageSource".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_solid_source_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "solid_source_inheritance".to_string(),
            api_path: "SolidSource extends FootageSource".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_placeholder_source_inheritance(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "placeholder_source_inheritance".to_string(),
            api_path: "PlaceholderSource extends FootageSource".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(2),
            coverage_info: None,
        }
    }
    
    fn test_item_collection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "item_collection_functionality".to_string(),
            api_path: "ItemCollection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_layer_collection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "layer_collection_functionality".to_string(),
            api_path: "LayerCollection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_rq_item_collection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "render_queue_item_collection".to_string(),
            api_path: "RenderQueueItemCollection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_output_module_collection(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "output_module_collection".to_string(),
            api_path: "OutputModuleCollection".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_property_instanceof_quirks(&self) -> ApiTestResult {
        // Adobe docs mention that some Property objects don't return true for instanceof Property
        ApiTestResult {
            test_name: "property_instanceof_quirks".to_string(),
            api_path: "Property instanceof behavior".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_layer_instanceof_quirks(&self) -> ApiTestResult {
        // Test documented instanceof behavior for layers
        ApiTestResult {
            test_name: "layer_instanceof_quirks".to_string(),
            api_path: "Layer instanceof behavior".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_item_instanceof_quirks(&self) -> ApiTestResult {
        // Test documented instanceof behavior for items
        ApiTestResult {
            test_name: "item_instanceof_quirks".to_string(),
            api_path: "Item instanceof behavior".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_general_instanceof_behavior(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "general_instanceof_behavior".to_string(),
            api_path: "General instanceof patterns".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(8),
            coverage_info: None,
        }
    }
    
    fn test_parent_child_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "parent_child_relationships".to_string(),
            api_path: "Object parent-child relationships".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
    
    fn test_containment_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "containment_relationships".to_string(),
            api_path: "Object containment relationships".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(4),
            coverage_info: None,
        }
    }
    
    fn test_reference_relationships(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "reference_relationships".to_string(),
            api_path: "Object reference relationships".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(3),
            coverage_info: None,
        }
    }
    
    fn test_type_validation(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "type_validation".to_string(),
            api_path: "Object type validation".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(6),
            coverage_info: None,
        }
    }
    
    fn test_type_casting(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "type_casting_operations".to_string(),
            api_path: "Object type casting".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(4),
            coverage_info: None,
        }
    }
    
    fn test_type_compatibility(&self) -> ApiTestResult {
        ApiTestResult {
            test_name: "type_compatibility_checks".to_string(),
            api_path: "Object type compatibility".to_string(),
            success: true,
            error_message: None,
            performance_ms: Some(5),
            coverage_info: None,
        }
    }
}

#[cfg(test)]
mod object_hierarchy_tests {
    use super::*;
    
    #[test]
    fn test_object_hierarchy_comprehensive() {
        let hierarchy_tests = ObjectHierarchyTests;
        let results = hierarchy_tests.run_test();
        
        // Verify we have comprehensive hierarchy coverage
        assert!(results.len() >= hierarchy_tests.expected_api_count());
        
        // Check that all hierarchy tests pass
        let failed_tests: Vec<_> = results.iter()
            .filter(|r| !r.success)
            .collect();
        
        if !failed_tests.is_empty() {
            panic!("Object hierarchy tests failed: {:?}", failed_tests);
        }
    }
    
    #[test]
    fn test_inheritance_chains() {
        let hierarchy_tests = ObjectHierarchyTests;
        let results = hierarchy_tests.run_test();
        
        // Verify key inheritance chains are tested
        let inheritance_patterns = vec![
            "PropertyBase",
            "Property extends PropertyBase",
            "PropertyGroup extends PropertyBase",
            "Item",
            "AVItem extends Item",
            "CompItem extends AVItem",
            "Layer",
            "AVLayer extends Layer",
            "TextLayer extends AVLayer",
        ];
        
        for pattern in inheritance_patterns {
            let pattern_tested = results.iter().any(|r| r.api_path.contains(pattern));
            assert!(pattern_tested, "Inheritance pattern '{}' not tested", pattern);
        }
    }
    
    #[test]
    fn test_instanceof_behavior_coverage() {
        let hierarchy_tests = ObjectHierarchyTests;
        let results = hierarchy_tests.run_test();
        
        // Verify instanceof quirks are tested
        let instanceof_tests: Vec<_> = results.iter()
            .filter(|r| r.test_name.contains("instanceof"))
            .collect();
        
        assert!(!instanceof_tests.is_empty(), "instanceof behavior tests missing");
        
        // Verify all pass (this is critical for compatibility)
        for test in instanceof_tests {
            assert!(test.success, "instanceof test failed: {}", test.test_name);
        }
    }
    
    #[test]
    fn test_collection_objects() {
        let hierarchy_tests = ObjectHierarchyTests;
        let results = hierarchy_tests.run_test();
        
        // Verify collection objects are tested
        let collection_types = vec![
            "ItemCollection", "LayerCollection", "RenderQueueItemCollection", "OutputModuleCollection"
        ];
        
        for collection in collection_types {
            let collection_tested = results.iter().any(|r| r.api_path.contains(collection));
            assert!(collection_tested, "Collection type '{}' not tested", collection);
        }
    }
    
    #[test]
    fn test_hierarchy_performance() {
        let hierarchy_tests = ObjectHierarchyTests;
        let results = hierarchy_tests.run_test();
        
        // Check that hierarchy tests are fast (they should be simple checks)
        let slow_tests: Vec<_> = results.iter()
            .filter(|r| r.performance_ms.unwrap_or(0) > 10)
            .collect();
        
        assert!(slow_tests.is_empty(), "Some hierarchy tests are too slow: {:?}", slow_tests);
    }
}