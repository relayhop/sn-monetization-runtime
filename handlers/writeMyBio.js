module.exports = {
  name: 'Write my bio',
  description: 'Handler for Write my bio bounty',
  execute: async (bounty) => {
    // Lógica para escrever a biografia
    console.log(`Processing bounty: ${bounty.id} - Write my bio`);
    // Gerar uma biografia padrão
    const bio = `This is a default bio for user ${bounty.user}.`;
    // Suponha que há uma função para salvar a biografia, mas por enquanto só logamos.
    console.log(`Bio generated: ${bio}`);
    return { success: true, bio };
  }
};
