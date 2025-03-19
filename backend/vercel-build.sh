#!/bin/bash

# Install Python dependencies
pip install -r requirements.txt

# Initialize database (if needed)
python -c "from app import db; db.create_all()" 