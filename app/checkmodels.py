import google.generativeai as genai
import os

# Configure your key
genai.configure(api_key="AIzaSyCmkrcSahGtxWqXx8rhgd_DVPnDWXpnBj0")

print("--- Available Models for your API Key ---")
for m in genai.list_models():
    # Only show models that can generate content (chat)
    if 'generateContent' in m.supported_generation_methods:
        # Clean up the name (remove 'models/' prefix for easier reading)
        print(m.name.replace("models/", ""))