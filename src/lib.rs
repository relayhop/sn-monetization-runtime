// Este é um exemplo de como o lib.rs deve ficar após a integração
// Se o arquivo já existir, adicione as linhas de módulo conforme necessário

pub mod stacker_stocks_bounty;

// Outros módulos existentes...
// pub mod other_module;

use stacker_stocks_bounty::StackerStocksBounty;

/// Função principal para processar novos bounties detectados
pub fn process_new_bounty(raw_data: &str) -> Result<String, String> {
    let bounty = StackerStocksBounty::from_raw_data(raw_data)
        .ok_or_else(|| "Failed to parse bounty data".to_string())?;
    
    let processed = bounty.process()
        .map_err(|e| format!("Processing error: {}", e))?;
    
    Ok(format!("Successfully processed bounty {}: {}", processed.bounty_id, processed.details))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_new_bounty_integration() {
        let raw = "1593178\tStacker_Stocks\t2\t559\t10000\t23\t9.3\t9274\t28416\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL\tStacker Stocks Weekly Close Contest 🟩 or 🟥- Week #14";
        let result = process_new_bounty(raw);
        
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.contains("1593178"));
        assert!(output.contains("Created contest for week 14"));
    }
}
