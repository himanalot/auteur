use std::collections::{HashMap, HashSet};
use itertools::Itertools;
use crate::data::match_names::{get_effect_match_names, get_layer_match_names, get_property_match_names};
use crate::validation::rules::{ValidationRule, MethodValidation, PropertyValueType, ArraySizeRule, RangeValidation};
use crate::validation::property::validate_property_value;
use crate::validation::context::{ValidationContext, ObjectContext, TextValidationContext, EffectInfo};
use crate::validation::temporal;
use serde_json::Value;

pub fn get_match_names() -> Vec<&'static str> {
    vec![
        "ADBE Transform Group",
        "ADBE Effect Parade",
        "ADBE Mask Parade",
        // ... add more match names
    ]
}


