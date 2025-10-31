use super::context::{ValidationContext, ObjectContext};
use serde_json::Value;
use std::collections::HashMap;

pub struct ScriptParser {
    context: ValidationContext,
    variables: HashMap<String, ObjectContext>,
}

impl ScriptParser {
    pub fn new() -> Self {
        ScriptParser {
            context: ValidationContext::new(),
            variables: HashMap::new(),
        }
    }

    pub fn parse_line(&mut self, line: &str) -> Result<(), String> {
        // Remove comments and trim whitespace
        let line = line.split("//").next().unwrap_or("").trim();
        if line.is_empty() {
            return Ok(());
        }

        // Handle variable declarations
        if line.starts_with("var ") {
            self.handle_variable_declaration(line)?;
        }
        // Handle property assignments
        else if line.contains("=") {
            self.handle_assignment(line)?;
        }
        // Handle method calls
        else if line.contains("(") {
            self.handle_method_call(line)?;
        }

        Ok(())
    }

    fn handle_variable_declaration(&mut self, line: &str) -> Result<(), String> {
        // Parse "var name = value"
        let parts: Vec<&str> = line["var ".len()..].split('=').collect();
        if parts.len() != 2 {
            return Ok(()); // Not an assignment
        }

        let var_name = parts[0].trim();
        let value = parts[1].trim();

        // Handle common AE object creations
        match value {
            v if v.contains("comp.layer") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Layer);
            }
            v if v.contains("addCamera") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Camera);
            }
            v if v.contains("addLight") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Light);
            }
            v if v.contains("addShape") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Shape);
            }
            v if v.contains("addText") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Text);
            }
            v if v.contains(".property") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Property(String::new()));
            }
            v if v.contains(".effect") => {
                self.variables.insert(var_name.to_string(), ObjectContext::Effect(String::new()));
            }
            _ => {
                // Try to parse as a value
                if let Ok(json_value) = serde_json::from_str(value) {
                    self.context.validate_assignment(var_name, &json_value, None)?;
                }
            }
        }

        Ok(())
    }

    fn handle_assignment(&mut self, line: &str) -> Result<(), String> {
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Ok(());
        }

        let target = parts[0].trim();
        let value = parts[1].trim();

        // Handle property assignments
        if target.contains('.') {
            let target_parts: Vec<&str> = target.split('.').collect();
            if let Some(obj_name) = target_parts.first() {
                if let Some(obj_context) = self.variables.get(*obj_name) {
                    self.context.enter_context(obj_context.clone());
                    
                    // Parse the value
                    if let Ok(json_value) = serde_json::from_str(value) {
                        if let Some(prop_name) = target_parts.last() {
                            self.context.validate_assignment(prop_name, &json_value, Some(prop_name))?;
                        }
                    }

                    self.context.exit_context();
                }
            }
        }

        Ok(())
    }

    fn handle_method_call(&mut self, line: &str) -> Result<(), String> {
        // Basic method call parsing
        if let Some(dot_idx) = line.find('.') {
            let obj_name = line[..dot_idx].trim();
            if let Some(obj_context) = self.variables.get(obj_name) {
                self.context.enter_context(obj_context.clone());
                // Method validation would go here
                self.context.exit_context();
            }
        }
        Ok(())
    }

    pub fn parse_script(&mut self, script: &str) -> Result<(), String> {
        for line in script.lines() {
            self.parse_line(line)?;
        }
        Ok(())
    }
} 