-- Enable the vector extension
create extension if not exists vector;

-- Function to create vector extension
create or replace function create_vector_extension()
returns void
language plpgsql
security definer
as $$
begin
  create extension if not exists vector;
end;
$$;

-- Function to drop documents table
create or replace function drop_documents_table()
returns void
language plpgsql
security definer
as $$
begin
  drop table if exists documents;
end;
$$;

-- Function to create documents table
create or replace function create_documents_table()
returns void
language plpgsql
security definer
as $$
begin
  create table documents (
    id bigint primary key generated always as identity,
    content text,
    path text,
    full_content text,
    embedding vector(768),
    created_at timestamp with time zone default timezone('utc'::text, now())
  );

  create index documents_embedding_idx 
  on documents 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
end;
$$;

-- Function to match documents based on embedding similarity
create or replace function match_documents(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  path text,
  full_content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    id,
    content,
    path,
    full_content,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$; 