use serde::{Deserialize, Serialize};

// Estrutura representando o Bounty detectado
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StackerStocksBounty {
    pub id: u64,
    pub name: String,
    pub week_number: u32,
    pub status: BountyStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BountyStatus {
    Open,
    Closed,
}

impl StackerStocksBounty {
    /// Cria uma nova instância do Stacker Stocks Bounty a partir dos dados brutos
    /// Formato esperado: "1593178	Stacker_Stocks	2	559	10000	23	9.3	9274	28416	recent@Stacker_Stocks|top@Stacker_Stocks	OPEN_BOUNTY,SIGNAL	Stacker Stocks Weekly Close Contest 🟩 or 🟥- Week #14"
    pub fn from_raw_data(raw: &str) -> Option<Self> {
        let parts: Vec<&str> = raw.split('\t').collect();
        if parts.len() < 12 {
            return None;
        }

        let id = parts[0].parse::<u64>().ok()?;
        let name = parts[1].to_string();
        // Assumindo que o campo de semana pode estar em partes específicas dependendo do parsing exato
        // Na string fornecida: "Stacker Stocks Weekly Close Contest 🟩 or 🟥- Week #14" está no final.
        // Vamos extrair o número da semana do título se possível, ou usar um valor padrão.
        
        let title = parts[11];
        let week_number = extract_week_number(title);

        Some(StackerStocksBounty {
            id,
            name,
            week_number,
            status: BountyStatus::Open,
        })
    }

    /// Processa o bounty, verificando se é válido e retornando o estado processado
    pub fn process(&self) -> Result<ProcessedBounty, &'static str> {
        if self.id == 0 {
            return Err("Invalid Bounty ID");
        }
        
        Ok(ProcessedBounty {
            bounty_id: self.id,
            action: BountyAction::CreateContest,
            details: format!("Created contest for week {}", self.week_number),
        })
    }
}

fn extract_week_number(title: &str) -> u32 {
    if let Some(pos) = title.find("Week #") {
        let start = pos + 6;
        if let Some(end) = title[start..].find(|c: char| !c.is_numeric()) {
            let week_str = &title[start..start + end];
            return week_str.parse().unwrap_or(1);
        }
    }
    1 // Default to week 1 if not found
}

#[derive(Debug, Clone)]
pub struct ProcessedBounty {
    pub bounty_id: u64,
    pub action: BountyAction,
    pub details: String,
}

#[derive(Debug, Clone)]
pub enum BountyAction {
    CreateContest,
    UpdateContest,
    CloseContest,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_from_raw_data_valid() {
        let raw = "1593178\tStacker_Stocks\t2\t559\t10000\t23\t9.3\t9274\t28416\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL\tStacker Stocks Weekly Close Contest 🟩 or 🟥- Week #14";
        let bounty = StackerStocksBounty::from_raw_data(raw);
        
        assert!(bounty.is_some());
        let b = bounty.unwrap();
        assert_eq!(b.id, 1593178);
        assert_eq!(b.name, "Stacker_Stocks");
        assert_eq!(b.week_number, 14);
        assert_eq!(b.status, BountyStatus::Open);
    }

    #[test]
    fn test_from_raw_data_invalid() {
        let raw = "invalid_data";
        let bounty = StackerStocksBounty::from_raw_data(raw);
        assert!(bounty.is_none());
    }

    #[test]
    fn test_process_valid() {
        let bounty = StackerStocksBounty {
            id: 1593178,
            name: "Stacker_Stocks".to_string(),
            week_number: 14,
            status: BountyStatus::Open,
        };
        
        let result = bounty.process();
        assert!(result.is_ok());
        let processed = result.unwrap();
        assert_eq!(processed.bounty_id, 1593178);
        assert_eq!(processed.action, BountyAction::CreateContest);
    }
}
