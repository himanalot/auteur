use crate::validation::context::ObjectContext;
use super::app::ApiObject;

pub struct CollectionObject {
    api_object: ApiObject,
}

impl CollectionObject {
    pub fn new() -> Self {
        Self {
            api_object: ApiObject::new(ObjectContext::Collection),
        }
    }
}


