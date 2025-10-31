use std::collections::HashMap;
use std::path::PathBuf;
use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MethodParameter {
    pub name: String,
    pub type_name: String,
    pub description: String,
    pub optional: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Method {
    pub name: String,
    pub description: String,
    pub parameters: Vec<MethodParameter>,
    pub return_type: String,
    pub example: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Property {
    pub name: String,
    pub type_name: String,
    pub description: String,
    pub read_only: bool,
    pub valid_values: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Class {
    pub name: String,
    pub description: String,
    pub parent_class: Option<String>,
    pub methods: HashMap<String, Method>,
    pub properties: HashMap<String, Property>,
}

#[derive(Debug)]
pub struct Documentation {
    classes: HashMap<String, Class>,
    effects: HashMap<String, String>, // matchname -> description
    match_names: HashMap<String, String>, // matchname -> object type
    global_functions: HashMap<String, Method>,
}

impl Documentation {
    pub fn new() -> Self {
        Documentation {
            classes: HashMap::new(),
            effects: HashMap::new(),
            match_names: HashMap::new(),
            global_functions: HashMap::new(),
        }
    }

    pub fn load_from_directory<P: AsRef<Path>>(docs_dir: P) -> Result<Self, Box<dyn std::error::Error>> {
        let mut doc = Documentation::new();
        
        // Load all class documentation directories
        let dirs_to_load = [
            "general",
            "layer", 
            "property",
            "item",
            "text",
            "sources",
            "renderqueue",
            "other"
        ];
        
        for dir_name in &dirs_to_load {
            let dir_path = docs_dir.as_ref().join(dir_name);
            if dir_path.exists() {
                doc.load_classes(&dir_path)?;
            }
        }
        
        // Load match names
        let matchnames_dir = docs_dir.as_ref().join("matchnames");
        if matchnames_dir.exists() {
            doc.load_match_names(&matchnames_dir)?;
        }

        // Load global functions
        let globals_file = docs_dir.as_ref().join("general/globals.md");
        if globals_file.exists() {
            doc.load_global_functions(&globals_file)?;
        }
        
        Ok(doc)
    }

    fn load_classes<P: AsRef<Path>>(&mut self, dir: P) -> Result<(), Box<dyn std::error::Error>> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                let content = fs::read_to_string(entry.path())?;
                if let Some(class) = self.parse_class_doc(&content) {
                    let class_name = class.name.clone();
                    
                    // Also add common aliases
                    match class_name.as_str() {
                        "Application" => {
                            self.classes.insert("app".to_string(), class.clone());
                        }
                        _ => {}
                    }
                    
                    self.classes.insert(class_name, class);
                }
            }
        }
        Ok(())
    }

    fn load_match_names<P: AsRef<Path>>(&mut self, dir: P) -> Result<(), Box<dyn std::error::Error>> {
        // Parse matchnames directory for effects and layer match names
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().is_dir() {
                match entry.file_name().to_string_lossy().as_ref() {
                    "effects" => self.load_effect_match_names(entry.path())?,
                    "layer" => self.load_layer_match_names(entry.path())?,
                    _ => {}
                }
            }
        }
        Ok(())
    }

    fn load_effect_match_names<P: AsRef<Path>>(&mut self, dir: P) -> Result<(), Box<dyn std::error::Error>> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                let content = fs::read_to_string(entry.path())?;
                self.parse_match_names(&content, "effect");
            }
        }
        Ok(())
    }

    fn load_layer_match_names<P: AsRef<Path>>(&mut self, dir: P) -> Result<(), Box<dyn std::error::Error>> {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().extension().map_or(false, |ext| ext == "md") {
                let content = fs::read_to_string(entry.path())?;
                self.parse_match_names(&content, "layer");
            }
        }
        Ok(())
    }

    fn load_global_functions<P: AsRef<Path>>(&mut self, file_path: P) -> Result<(), Box<dyn std::error::Error>> {
        let content = fs::read_to_string(file_path)?;
        self.parse_global_functions(&content);
        Ok(())
    }

    fn parse_class_doc(&self, content: &str) -> Option<Class> {
        let lines: Vec<&str> = content.lines().collect();
        let mut line_idx = 0;
        
        // Get class name from first heading
        while line_idx < lines.len() {
            let line = lines[line_idx].trim();
            if line.starts_with("# ") {
                break;
            }
            line_idx += 1;
        }
        
        if line_idx >= lines.len() {
            return None;
        }
        
        let name = lines[line_idx]
            .strip_prefix("# ")
            .map(|s| s.split_whitespace().next().unwrap_or("").to_string())?;

        let mut class = Class {
            name: name.clone(),
            description: String::new(),
            parent_class: None,
            methods: HashMap::new(),
            properties: HashMap::new(),
        };

        // Parse description
        line_idx += 1;
        while line_idx < lines.len() {
            let line = lines[line_idx].trim();
            if line.starts_with("##") || line.starts_with("---") {
                break;
            }
            if !line.is_empty() && !line.starts_with("`") {
                class.description.push_str(line);
                class.description.push(' ');
            }
            line_idx += 1;
        }

        // Parse methods and properties
        while line_idx < lines.len() {
            let line = lines[line_idx].trim();
            
            if line.starts_with("### ") {
                let section_name = line.strip_prefix("### ").unwrap();
                
                if section_name.contains("()") {
                    // Method
                    if let Some(method) = self.parse_method_section(&lines, &mut line_idx) {
                        class.methods.insert(method.name.clone(), method);
                    }
                } else if section_name.contains(".") {
                    // Property
                    if let Some(property) = self.parse_property_section(&lines, &mut line_idx) {
                        class.properties.insert(property.name.clone(), property);
                    }
                }
            }
            line_idx += 1;
        }

        Some(class)
    }

    fn parse_method_section(&self, lines: &[&str], line_idx: &mut usize) -> Option<Method> {
        let header = lines[*line_idx].trim();
        let full_name = header.strip_prefix("### ")?;
        
        // Extract method name from full signature
        let method_name = if let Some(dot_pos) = full_name.rfind('.') {
            let method_part = &full_name[dot_pos + 1..];
            if let Some(paren_pos) = method_part.find('(') {
                method_part[..paren_pos].to_string()
            } else {
                method_part.to_string()
            }
        } else {
            full_name.replace("()", "")
        };

        let mut method = Method {
            name: method_name,
            description: String::new(),
            parameters: Vec::new(),
            return_type: "void".to_string(),
            example: None,
        };

        *line_idx += 1;
        
        // Parse method details
        while *line_idx < lines.len() {
            let line = lines[*line_idx].trim();
            
            if line.starts_with("### ") {
                // Next section
                *line_idx -= 1;
                break;
            }
            
            if line.starts_with("#### Description") {
                *line_idx += 1;
                while *line_idx < lines.len() {
                    let desc_line = lines[*line_idx].trim();
                    if desc_line.starts_with("#### ") || desc_line.starts_with("### ") {
                        break;
                    }
                    if !desc_line.is_empty() {
                        method.description.push_str(desc_line);
                        method.description.push(' ');
                    }
                    *line_idx += 1;
                }
                continue;
            }
            
            if line.starts_with("#### Parameters") {
                method.parameters = self.parse_parameters_section(lines, line_idx);
                continue;
            }
            
            if line.starts_with("#### Returns") {
                *line_idx += 1;
                if *line_idx < lines.len() {
                    method.return_type = lines[*line_idx].trim().to_string();
                }
            }
            
            *line_idx += 1;
        }

        Some(method)
    }

    fn parse_property_section(&self, lines: &[&str], line_idx: &mut usize) -> Option<Property> {
        let header = lines[*line_idx].trim();
        let full_name = header.strip_prefix("### ")?;
        
        // Extract property name
        let property_name = if let Some(dot_pos) = full_name.rfind('.') {
            full_name[dot_pos + 1..].to_string()
        } else {
            full_name.to_string()
        };

        let mut property = Property {
            name: property_name,
            type_name: "any".to_string(),
            description: String::new(),
            read_only: false,
            valid_values: None,
        };

        *line_idx += 1;
        
        // Parse property details
        while *line_idx < lines.len() {
            let line = lines[*line_idx].trim();
            
            if line.starts_with("### ") {
                *line_idx -= 1;
                break;
            }
            
            if line.starts_with("#### Description") {
                *line_idx += 1;
                while *line_idx < lines.len() {
                    let desc_line = lines[*line_idx].trim();
                    if desc_line.starts_with("#### ") || desc_line.starts_with("### ") {
                        break;
                    }
                    if !desc_line.is_empty() {
                        property.description.push_str(desc_line);
                        property.description.push(' ');
                    }
                    *line_idx += 1;
                }
                continue;
            }
            
            if line.starts_with("#### Type") {
                *line_idx += 1;
                if *line_idx < lines.len() {
                    let type_line = lines[*line_idx].trim();
                    property.type_name = type_line.to_string();
                    property.read_only = type_line.contains("read-only") || type_line.contains("read only");
                    
                    // Parse enum values if present
                    if type_line.contains("enumerated value") {
                        property.valid_values = self.parse_enum_values(lines, line_idx);
                    }
                }
            }
            
            *line_idx += 1;
        }

        Some(property)
    }

    fn parse_parameters_section(&self, lines: &[&str], line_idx: &mut usize) -> Vec<MethodParameter> {
        let mut parameters = Vec::new();
        *line_idx += 1;

        while *line_idx < lines.len() {
            let line = lines[*line_idx].trim();
            
            if line.starts_with("#### ") || line.starts_with("### ") {
                break;
            }
            
            // Parse parameter table rows
            if line.starts_with("|") && !line.contains("---") {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 4 {
                    let name = parts[1].trim().replace("`", "");
                    let type_name = parts[2].trim().to_string();
                    let description = parts[3].trim().to_string();
                    
                    if !name.is_empty() && name != "Parameter" {
                        parameters.push(MethodParameter {
                            name,
                            type_name,
                            description: description.clone(),
                            optional: description.to_lowercase().contains("optional"),
                        });
                    }
                }
            }
            
            *line_idx += 1;
        }

        parameters
    }

    fn parse_enum_values(&self, lines: &[&str], line_idx: &mut usize) -> Option<Vec<String>> {
        let mut values = Vec::new();
        *line_idx += 1;

        while *line_idx < lines.len() {
            let line = lines[*line_idx].trim();
            
            if line.starts_with("#### ") || line.starts_with("### ") {
                break;
            }
            
            // Look for enum values like "- `EnumName.VALUE`"
            if line.starts_with("- `") && line.contains(".") {
                if let Some(value) = line.strip_prefix("- `").and_then(|s| s.strip_suffix("`")) {
                    values.push(value.to_string());
                }
            }
            
            *line_idx += 1;
        }

        if values.is_empty() {
            None
        } else {
            Some(values)
        }
    }

    fn parse_match_names(&mut self, content: &str, match_type: &str) {
        // Parse match name tables from markdown
        let lines: Vec<&str> = content.lines().collect();
        
        for line in lines {
            if line.starts_with("|") && !line.contains("---") && line.contains("|") {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 3 {
                    let match_name = parts[1].trim().replace("`", "");
                    let description = parts[2].trim();
                    
                    if !match_name.is_empty() && match_name != "Match Name" {
                        self.match_names.insert(match_name.clone(), match_type.to_string());
                        if match_type == "effect" {
                            self.effects.insert(match_name, description.to_string());
                        }
                    }
                }
            }
        }
    }

    fn parse_global_functions(&mut self, content: &str) {
        let lines: Vec<&str> = content.lines().collect();
        let mut line_idx = 0;

        while line_idx < lines.len() {
            let line = lines[line_idx].trim();
            
            if line.starts_with("### ") && line.contains("()") {
                if let Some(function) = self.parse_method_section(&lines, &mut line_idx) {
                    self.global_functions.insert(function.name.clone(), function);
                }
            }
            line_idx += 1;
        }
    }

    pub fn validate_method_call(&self, class_name: &str, method_name: &str, args: &[String]) -> Result<(), String> {
        // Check global functions first
        if let Some(func) = self.global_functions.get(method_name) {
            if args.len() != func.parameters.len() {
                return Err(format!(
                    "Wrong number of arguments for {}(). Expected {}, got {}",
                    method_name,
                    func.parameters.len(),
                    args.len()
                ));
            }
            return Ok(());
        }

        // Check class methods
        if let Some(class) = self.classes.get(class_name) {
            if let Some(method) = class.methods.get(method_name) {
                if args.len() != method.parameters.len() {
                    return Err(format!(
                        "Wrong number of arguments for {}.{}(). Expected {}, got {}",
                        class_name,
                        method_name,
                        method.parameters.len(),
                        args.len()
                    ));
                }
                return Ok(());
            } else {
                return Err(format!("Method {} not found in class {}", method_name, class_name));
            }
        } else {
            return Err(format!("Class {} not found", class_name));
        }
    }

    pub fn validate_property_access(&self, class_name: &str, property_name: &str) -> Result<(), String> {
        if let Some(class) = self.classes.get(class_name) {
            if let Some(_prop) = class.properties.get(property_name) {
                Ok(())
            } else {
                Err(format!("Property {} not found in class {}", property_name, class_name))
            }
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    pub fn validate_property_value(&self, class_name: &str, property_name: &str, value: &str) -> Result<(), String> {
        if let Some(class) = self.classes.get(class_name) {
            if let Some(prop) = class.properties.get(property_name) {
                if let Some(valid_values) = &prop.valid_values {
                    if !valid_values.contains(&value.to_string()) {
                        return Err(format!(
                            "Invalid value for {}.{}. Expected one of: {:?}",
                            class_name, property_name, valid_values
                        ));
                    }
                }
                Ok(())
            } else {
                Err(format!("Property {} not found in class {}", property_name, class_name))
            }
        } else {
            Err(format!("Class {} not found", class_name))
        }
    }

    pub fn get_class_info(&self, class_name: &str) -> Option<&Class> {
        self.classes.get(class_name)
    }

    pub fn get_method_info(&self, class_name: &str, method_name: &str) -> Option<&Method> {
        self.classes.get(class_name)?.methods.get(method_name)
    }

    pub fn get_property_info(&self, class_name: &str, property_name: &str) -> Option<&Property> {
        self.classes.get(class_name)?.properties.get(property_name)
    }

    pub fn get_global_function_info(&self, function_name: &str) -> Option<&Method> {
        self.global_functions.get(function_name)
    }

    pub fn is_valid_effect_match_name(&self, match_name: &str) -> bool {
        self.effects.contains_key(match_name)
    }

    pub fn get_loaded_classes(&self) -> Vec<&String> {
        self.classes.keys().collect()
    }

    pub fn get_stats(&self) -> (usize, usize, usize, usize) {
        (
            self.classes.len(),
            self.classes.values().map(|c| c.methods.len()).sum(),
            self.classes.values().map(|c| c.properties.len()).sum(),
            self.effects.len(),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_documentation() {
        let doc_path = PathBuf::from("after-effects-scripting-guide/docs");
        if doc_path.exists() {
            let result = Documentation::load_from_directory(doc_path);
            assert!(result.is_ok());
            
            let doc = result.unwrap();
            let (classes, methods, properties, effects) = doc.get_stats();
            
            println!("Loaded {} classes, {} methods, {} properties, {} effects", 
                     classes, methods, properties, effects);
            
            // Should have loaded some classes
            assert!(classes > 0);
            
            // Should have loaded some methods
            assert!(methods > 0);
            
            // Should have loaded some properties  
            assert!(properties > 0);
            
            // Print some loaded classes for verification
            let loaded_classes = doc.get_loaded_classes();
            println!("Sample loaded classes: {:?}", &loaded_classes[..std::cmp::min(5, loaded_classes.len())]);
        }
    }

    #[test]
    fn test_method_validation() {
        let doc_path = PathBuf::from("after-effects-scripting-guide/docs");
        if doc_path.exists() {
            let doc = Documentation::load_from_directory(doc_path).unwrap();
            
            // Test a known method if it exists
            if let Some(_app_class) = doc.get_class_info("Application") {
                // Test method validation would go here
            }
        }
    }
}