QUERY load_chapter(chapter_index: I64, title: String, content: String) =>
    chapter_node <- AddN<Chapter>({ chapter_index: chapter_index })
    subchapter_node <- AddN<SubChapter>({ title: title, content: content })
    AddE<Contains>::From(chapter_node)::To(subchapter_node)
    RETURN subchapter_node

QUERY load_embedding(subchapter_id: ID, chunk: String, vector: [F64]) =>
    subchapter <- N<SubChapter>(subchapter_id)
    vec <- AddV<Embedding>(vector)
    AddE<EmbeddingOf>({chunk: chunk})::From(subchapter)::To(vec)
    RETURN vec

QUERY search_docs_rag(query: [F64], k: I32) =>
    vecs <- SearchV<Embedding>(query, k)
    embedding_edges <- vecs::InE<EmbeddingOf>
    RETURN embedding_edges::{
        chunk: _::{chunk},
        subchapter_title: _::FromN::{title},
        subchapter_content: _::FromN::{content}
    }

QUERY create_chapter(chapter_index: I64) =>
    chapter <- AddN<Chapter>({chapter_index: chapter_index})
    RETURN chapter

QUERY get_chapter_content(chapter_index: I64) =>
    chapter <- N<Chapter>::WHERE(_::{chapter_index}::EQ(chapter_index))
    subchapters <- chapter::Out<Contains>
    RETURN subchapters::{
        title: _::{title},
        content: _::{content}
    }