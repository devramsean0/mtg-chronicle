use std::env::var;
use reqwest::Url;
use serde_derive::{Deserialize, Serialize};
use serde_json::Value;
use exitfailure::ExitFailure;
use redis::Commands;

#[derive(Debug, Deserialize, Serialize)]
struct BulkDataAPIResponse {
    object: String,
    id: String,
    r#type: String,
    updated_at: String,
    uri: String,
    name: String,
    description: String,
    size: usize,
    download_uri: String,
    content_type: String,
    content_encoding: String,
}

async fn fetch_dump_api_object() -> Result<BulkDataAPIResponse, ExitFailure>{
    // Fetches the dump location from Scryfall's API
    let url = Url::parse("https://api.scryfall.com/bulk-data/oracle-cards")?;
    let response = reqwest::get(url).await?.json::<BulkDataAPIResponse>().await?;
    Ok(response)
}
async fn fetch_dump_data(url: String) -> Result<Value, ExitFailure> {
    // Fetches the dump data from the location provided by Scryfall's API
    let response = reqwest::get(url).await?.text().await?;
    // Parse to JSON
    let data: Value = serde_json::from_str(response.as_str()).unwrap();
    Ok(data)
}
fn set_expiry(key: String, con: &mut redis::Connection) -> redis::RedisResult<usize> {
    redis::cmd("EXPIRE").arg(&key).arg(604800).query(con)
}

#[tokio::main]
async fn main() -> Result<(), ExitFailure> {
    let redis_url = var("REDIS_URL").unwrap_or(String::from("redis://127.0.0.1:6379"));
    let redis_client = redis::Client::open(redis_url.as_str())?;
    let mut con = redis_client.get_connection()?;
    
    let fetch_dump_api_object = fetch_dump_api_object().await?;
    let dump_data = fetch_dump_data(fetch_dump_api_object.download_uri).await?;
    // Do the loop
    for card in dump_data.as_array().unwrap() {
        let key_name = format!("card:{}", card["name"].as_str().unwrap());
        let _ = con.set(key_name.clone(), card.to_string())?;
        set_expiry(key_name, &mut con)?;
    }
    //println!("Dump API Object: {:?}", dump_data);

    Ok(())
}
