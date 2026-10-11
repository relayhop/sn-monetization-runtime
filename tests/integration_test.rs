use sn_monetization_runtime::process_new_bounty;

#[test]
fn test_open_bounty_detection_and_processing() {
    // Dados do bounty detectado
    let raw_data = "1593178\tStacker_Stocks\t2\t559\t10000\t23\t9.3\t9274\t28416\trecent@Stacker_Stocks|top@Stacker_Stocks\tOPEN_BOUNTY,SIGNAL\tStacker Stocks Weekly Close Contest 🟩 or 🟥- Week #14";

    // Processar o bounty
    let result = process_new_bounty(raw_data);

    // Verificar se o processamento foi bem-sucedido
    assert!(result.is_ok(), "Bounty should be processed successfully");

    let message = result.unwrap();
    
    // Verificar se a mensagem contém informações relevantes
    assert!(message.contains("1593178"), "Message should contain bounty ID");
    assert!(message.contains("Week 14"), "Message should contain week number");
}
