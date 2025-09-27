from app import app, db

if __name__ == '__main__':
    with app.app_context():
        # Ensure all tables are created
        db.create_all()
    
    # Run the Flask development server
    app.run(host='0.0.0.0', port=5000, debug=True)
