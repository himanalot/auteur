
// DEFAULT CODE
// use helix_db::helix_engine::graph_core::config::Config;

// pub fn config() -> Option<Config> {
//     None
// }



use heed3::RoTxn;
use helix_macros::{handler, tool_call, mcp_handler};
use helix_db::{
    helix_engine::{
        graph_core::{
            config::{Config, GraphConfig, VectorConfig},
            ops::{
                bm25::search_bm25::SearchBM25Adapter,
                g::G,
                in_::{in_::InAdapter, in_e::InEdgesAdapter, to_n::ToNAdapter, to_v::ToVAdapter},
                out::{
                    from_n::FromNAdapter, from_v::FromVAdapter, out::OutAdapter, out_e::OutEdgesAdapter,
                },
                source::{
                    add_e::{AddEAdapter, EdgeType},
                    add_n::AddNAdapter,
                    e_from_id::EFromIdAdapter,
                    e_from_type::EFromTypeAdapter,
                    n_from_id::NFromIdAdapter,
                    n_from_index::NFromIndexAdapter,
                    n_from_type::NFromTypeAdapter,
                },
                tr_val::{Traversable, TraversalVal},
                util::{
                    dedup::DedupAdapter, drop::Drop, exist::Exist, filter_mut::FilterMut,
                    filter_ref::FilterRefAdapter, map::MapAdapter, paths::ShortestPathAdapter,
                    props::PropsAdapter, range::RangeAdapter, update::UpdateAdapter,
                },
                vectors::{
                    brute_force_search::BruteForceSearchVAdapter, insert::InsertVAdapter,
                    search::SearchVAdapter,
                },
            }
        },
        types::GraphError,
        vector_core::vector::HVector,
    },
    helix_gateway::{
        embedding_providers::embedding_providers::{EmbeddingModel, get_embedding_model},
        router::router::HandlerInput,
        mcp::mcp::{MCPHandlerSubmission, MCPToolInput, MCPHandler}
    },
    node_matches, props, embed,
    field_remapping, identifier_remapping, 
    traversal_remapping, exclude_field, value_remapping, 
    protocol::{
        remapping::{Remapping, RemappingMap, ResponseRemapping},
        response::Response,
        return_values::ReturnValue,
        value::Value,
        format::Format,
    },
    utils::{
        count::Count,
        filterable::Filterable,
        id::ID,
        items::{Edge, Node},
    },
};
use sonic_rs::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::Instant;
use chrono::{DateTime, Utc};
    
pub fn config() -> Option<Config> {return Some(Config {vector_config: Some(VectorConfig {m: Some(16),ef_construction: Some(128),ef_search: Some(768),}),graph_config: Some(GraphConfig {secondary_indices: Some(vec![]),}),db_max_size_gb: Some(20),mcp: Some(true),bm25: Some(true),schema: None,embedding_model: Some("text-embedding-ada-002".to_string()),graphvis_node_label: Some("title".to_string()),})}
pub struct Chapter {
    pub chapter_index: i64,
}

pub struct SubChapter {
    pub title: String,
    pub content: String,
}

pub struct Contains {
    pub from: Chapter,
    pub to: SubChapter,
}

pub struct EmbeddingOf {
    pub from: SubChapter,
    pub to: Embedding,
    pub chunk: String,
}

pub struct Embedding {
}

#[derive(Serialize, Deserialize)]
pub struct load_embeddingInput {

pub subchapter_id: ID,
pub chunk: String,
pub vector: Vec<f64>
}
#[handler(with_write)]
pub fn load_embedding (input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
{
    let subchapter = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.subchapter_id).collect_to_obj();
    let vec = G::new_mut(Arc::clone(&db), &mut txn)
.insert_v::<fn(&HVector, &RoTxn) -> bool>(&data.vector, "Embedding", None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("EmbeddingOf", Some(props! { "chunk" => data.chunk.clone() }), subchapter.id(), vec.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("vec".to_string(), ReturnValue::from_traversal_value_with_mixin(vec.clone().clone(), remapping_vals.borrow_mut()));

}
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct create_chapterInput {

pub chapter_index: i64
}
#[handler(with_write)]
pub fn create_chapter (input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
{
    let chapter = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Chapter", Some(props! { "chapter_index" => &data.chapter_index }), None).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("chapter".to_string(), ReturnValue::from_traversal_value_with_mixin(chapter.clone().clone(), remapping_vals.borrow_mut()));

}
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct load_chapterInput {

pub chapter_index: i64,
pub title: String,
pub content: String
}
#[handler(with_write)]
pub fn load_chapter (input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
{
    let chapter_node = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Chapter", Some(props! { "chapter_index" => &data.chapter_index }), None).collect_to_obj();
    let subchapter_node = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("SubChapter", Some(props! { "title" => &data.title, "content" => &data.content }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Contains", None, chapter_node.id(), subchapter_node.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("subchapter_node".to_string(), ReturnValue::from_traversal_value_with_mixin(subchapter_node.clone().clone(), remapping_vals.borrow_mut()));

}
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct search_docs_ragInput {

pub query: Vec<f64>,
pub k: i32
}
#[handler(with_read)]
pub fn search_docs_rag (input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
{
    let vecs = G::new(Arc::clone(&db), &txn)
.search_v::<fn(&HVector, &RoTxn) -> bool>(&data.query, data.k as usize, None).collect_to::<Vec<_>>();
    let embedding_edges = G::new_from(Arc::clone(&db), &txn, vecs.clone())

.in_e("EmbeddingOf").collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("embedding_edges".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, embedding_edges.clone())

.map_traversal(|item, txn| { traversal_remapping!(remapping_vals, item.clone(), false, "chunk" => G::new_from(Arc::clone(&db), &txn, vec![item.clone()])

.check_property("chunk").collect_to::<Vec<_>>())?;
traversal_remapping!(remapping_vals, item.clone(), false, "subchapter_title" => G::new_from(Arc::clone(&db), &txn, vec![item.clone()])

.from_n()

.check_property("title").collect_to::<Vec<_>>())?;
traversal_remapping!(remapping_vals, item.clone(), false, "subchapter_content" => G::new_from(Arc::clone(&db), &txn, vec![item.clone()])

.from_n()

.check_property("content").collect_to::<Vec<_>>())?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct get_chapter_contentInput {

pub chapter_index: i64
}
#[handler(with_read)]
pub fn get_chapter_content (input: &HandlerInput, response: &mut Response) -> Result<(), GraphError> {
{
    let chapter = G::new(Arc::clone(&db), &txn)
.n_from_type("Chapter")

.filter_ref(|val, txn|{
                if let Ok(val) = val { 
                    Ok(G::new_from(Arc::clone(&db), &txn, val.clone())

.check_property("chapter_index")

.map_value_or(false, |v| *v == data.chapter_index.clone())?)
                } else {
                    Ok(false)
                }
            }).collect_to::<Vec<_>>();
    let subchapters = G::new_from(Arc::clone(&db), &txn, chapter.clone())

.out("Contains",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("subchapters".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, subchapters.clone())

.map_traversal(|item, txn| { traversal_remapping!(remapping_vals, item.clone(), false, "title" => G::new_from(Arc::clone(&db), &txn, vec![item.clone()])

.check_property("title").collect_to::<Vec<_>>())?;
traversal_remapping!(remapping_vals, item.clone(), false, "content" => G::new_from(Arc::clone(&db), &txn, vec![item.clone()])

.check_property("content").collect_to::<Vec<_>>())?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
    Ok(())
}
