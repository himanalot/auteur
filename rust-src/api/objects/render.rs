use crate::validation::context::ObjectContext;
use super::app::ApiObject;

pub struct RenderQueueObject {
    api_object: ApiObject,
}

impl RenderQueueObject {
    pub fn new() -> Self {
        Self {
            api_object: ApiObject::new(ObjectContext::RenderQueue),
        }
    }
}


