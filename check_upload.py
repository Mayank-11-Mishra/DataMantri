from app import app, db, Upload

with app.app_context():
    # Get all upload records
    print("\n=== All Upload Records ===")
    uploads = Upload.query.all()
    for upload in uploads:
        print(f"\nID: {upload.id}")
        print(f"Filename: {upload.filename}")
        print(f"Status: {upload.status}")
        print(f"Upload Time: {upload.upload_time}")
        print(f"Transform Time: {upload.transform_time}")
        print(f"Update Time: {upload.update_time}")
        print(f"Processed At: {upload.processed_at}")
        print(f"User ID: {upload.user_id}")
        
        # Check if there are any lead records for this upload
        lead_count = len(upload.records) if hasattr(upload, 'records') else 0
        print(f"Lead Records: {lead_count}")
        
        # If there are records, show a sample
        if lead_count > 0:
            sample = upload.records[0] if lead_count > 0 else None
            if sample:
                print(f"Sample Lead ID: {sample.id}")
                print(f"Sample Lead Status: {sample.status}")
