# List of offensive words
offensive_words = [
    "fucked",
    "asshole",
    "damn",
    "crap",
    # Add more offensive words as needed
]


def is_offensive(text):
    """Check if the given text contains any offensive words.
    
    :param text: The text to check
    :return: True if the text contains offensive words, False otherwise
    """
    for word in offensive_words:
        if word in text.lower():
            return True
    return False


def moderate_content(content):
    """Moderate the content and take appropriate action.
    
    :param content: The content to moderate
    :return: A dictionary with the moderated content and status
    """
    moderated_content = {
        "content": content,
        "status": "approved"
    }
    
    if is_offensive(content["description"]):
        moderated_content["status"] = "flagged"
        print(f"Content flagged for offensive language: {content['description']}")
    
    return moderated_content


# Example content
content = {
    "id": 1509986,
    "category": "Politics_And_Law",
    "priority": 3,
    "views": 1108,
    "rewards": 10000,
    "comments": 72,
    "rating": 20.8,
    "votes": 166,
    "score": 36565,
    "tags": "recent@Politics_And_Law|top@Politics_And_Law",
    "type": "OPEN_BOUNTY,HOT",
    "description": "10k CCs if you prove me how you fucked the gov recently"
}

# Moderate the content
moderated_content = moderate_content(content)

# Output the result
print(moderated_content)