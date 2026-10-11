use crate::models::bounty::{BountyEvent, parse_bounty_line};
use crate::services::signal_service;
use crate::services::post_opportunity_service;
use log::{info, warn};

pub async fn handle_new_bounty(raw_line: &str) {
    match parse_bounty_line(raw_line) {
        Ok(bounty) => {
            info!("Processed new bounty: {} with ID {}", bounty.title, bounty.id);
            
            // Processar se for um Signal
            if bounty.is_signal() {
                info!("Bounty {} contains SIGNAL tag. Processing signal...", bounty.id);
                // Aqui chamaria a função real de envio de sinal
                // signal_service::send_signal(&bounty.data.targets, &bounty.data.reward_amount).await;
                
                // Simulação de ação
                for target in &bounty.data.targets {
                    info!("Sending signal to target: {}", target);
                }
            }

            // Processar se for Self Post Opportunity
            if bounty.is_self_post_opportunity() {
                info!("Bounty {} contains SELF_POST_OPP tag. Processing post opportunity...", bounty.id);
                // post_opportunity_service::create_post_opportunity(&bounty).await;
                
                // Simulação de ação
                info!("Creating self-post opportunity for user {}", bounty.data.creator_id);
            }

            // Lógica adicional baseada no tipo OPEN_BOUNTY
            if matches!(bounty.type_, BountyType::OPEN_BOUNTY) {
                info!("Bounty {} is OPEN. Registering in active bounties list.", bounty.id);
                // active_bounties::register(&bounty).await;
            }
        }
        Err(e) => {
            warn!("Failed to parse bounty line: {:?}. Line: {}", e, raw_line);
        }
    }
}

// Função wrapper para ser chamada pelo main loop ou webhook
pub async fn process_bounty_event(raw_data: &str) {
    handle_new_bounty(raw_data).await;
}
