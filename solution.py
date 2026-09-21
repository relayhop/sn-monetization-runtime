# Import necessary libraries
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

# Initialize the Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bounties.db'
app.config['JWT_SECRET_KEY'] = 'your_secret_key'
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Define the User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    approved = db.Column(db.Boolean, default=False)

# Define the Bounty model
class Bounty(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False)

# Create the database tables
db.create_all()

# Define the task confirmation token
def generate_task_confirmation_token(user_id):
    return create_access_token(identity=user_id, expires_delta=timedelta(hours=1))

# Define the approve user function
@app.route('/approve', methods=['POST'])
@jwt_required()
def approve_user():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.approved:
        return jsonify({'error': 'User is already approved'}), 400

    user.approved = True
    db.session.commit()

    return jsonify({'message': 'User approved'}), 200

# Define the check approval status function
@app.route('/check_approval', methods=['GET'])
@jwt_required()
def check_approval():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.approved:
        return jsonify({'approved': True}), 200
    else:
        return jsonify({'approved': False}), 200

# Define the stock discussion contest function
@app.route('/stock_discussion', methods=['POST'])
@jwt_required()
def stock_discussion():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not user.approved:
        return jsonify({'error': 'User must be approved to participate'}), 403

    # Handle the stock discussion contest
    # This is a placeholder for the actual stock discussion contest logic
    # For example, it could involve a human moderator approving the user's participation
    # and then processing the bounty accordingly

    return jsonify({'message': 'Stock discussion contest approved'}), 200

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)