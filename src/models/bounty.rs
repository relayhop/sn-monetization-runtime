use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BountyEvent {
    pub id: u64,
    pub title: String,
    pub type_: BountyType,
    pub tags: Vec<String>,
    pub data: BountyData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BountyType {
    OPEN_BOUNTY,
    CLOSED_BOUNTY,
    SIGNAL,
    SELF_POST_OPP,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BountyData {
    /// Exemplo: 2 (pode ser prioridade ou versão)
    pub priority: u32,
    /// Exemplo: 515 (pode ser ID interno ou contador)
    pub internal_id: u32,
    /// Exemplo: 10000 (recompensa em tokens/sats)
    pub reward_amount: u64,
    /// Exemplo: 19 (duração em horas? dias?)
    pub duration_hours: u32,
    /// Exemplo: 4.7 (score de confiança?)
    pub confidence_score: f64,
    /// Exemplo: 9274 (ID do usuário criador?)
    pub creator_id: u64,
    /// Exemplo: 28409 (timestamp ou outro ID relacionado)
    pub related_event_id: u64,
    /// Alvos: recent@Stacker_Stocks|top@Stacker_Stocks
    pub targets: Vec<String>,
}

impl BountyEvent {
    pub fn is_signal(&self) -> bool {
        self.tags.contains(&"SIGNAL".to_string())
    }

    pub fn is_self_post_opportunity(&self) -> bool {
        self.tags.contains(&"SELF_POST_OPP".to_string())
    }
}

/// Parser para converter a string bruta do bounty em uma struct BountyEvent
pub fn parse_bounty_line(line: &str) -> Option<BountyEvent> {
    let parts: Vec<&str> = line.split('\t').collect();
    
    if parts.len() < 9 {
        return None;
    }

    // Formato esperado baseado na issue:
    // ID | Title | TypeInt? | InternalId | Reward | Duration | Score | CreatorId | RelatedId | Targets | Tags...
    
    let id = parts[0].parse::<u64>().ok()?;
    let title = parts[1].to_string();
    
    // O campo 'type_' pode ser inferido das tags ou de um campo numérico. 
    // Na issue, há um '2' após o título. Vamos assumir que isso seja um código de tipo ou prioridade.
    let priority = parts[2].parse::<u32>().unwrap_or(0);
    let internal_id = parts[3].parse::<u32>().ok()?;
    let reward_amount = parts[4].parse::<u64>().ok()?;
    let duration_hours = parts[5].parse::<u32>().ok()?;
    let confidence_score = parts[6].parse::<f64>().ok()?;
    let creator_id = parts[7].parse::<u64>().ok()?;
    let related_event_id = parts[8].parse::<u64>().ok()?;
    
    let targets_str = parts[9];
    let targets: Vec<String> = targets_str.split('|').map(|s| s.to_string()).collect();
    
    let tags_str = parts[10];
    let tags: Vec<String> = tags_str.split(',').map(|s| s.trim().to_string()).collect();

    let type_ = if tags.contains(&"OPEN_BOUNTY".to_string()) {
        BountyType::OPEN_BOUNTY
    } else {
        // Default ou fallback
        BountyType::CLOSED_BOUNTY
    };

    Some(BountyEvent {
        id,
        title,
        type_,
        tags,
        data: BountyData {
            priority,
            internal_id,
            reward_amount,
            duration_hours,
            confidence_score,
            creator_id,
            related_event_id,
            targets,
        },
    })
}
