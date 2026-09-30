function parseBounty(data) {
    const fields = data.split('\t');
    return {
        id: fields[0],
        user: fields[1],
        score: fields[2],
        viewCount: fields[3],
        bountyAmount: fields[4],
        answerCount: fields[5],
        rating: fields[6],
        questionId: fields[7],
        answerId: fields[8],
        owner: fields[9],
        tags: fields[10].split(','),
        title: fields[11]
    };
}
module.exports = { parseBounty };