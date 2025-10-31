use std::collections::HashMap;
use crate::api::{UnifiedApi};
use crate::api::objects::app::ApiObject;

pub fn get_core_api() -> HashMap<String, ApiObject> {
    let api = UnifiedApi::new();
    api.objects
} 