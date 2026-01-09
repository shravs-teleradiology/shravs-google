# Deploy to Google Cloud Run (single service: static + API)

## 1) Prerequisites
- Google Cloud account + a project
- gcloud CLI installed

## 2) Set env vars on Cloud Run
Set these in Cloud Run service (NOT in git):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

## 3) Deploy
From this folder:

gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud services enable run.googleapis.com cloudbuild.googleapis.com

gcloud run deploy shravs-app   --source .   --region asia-south1   --allow-unauthenticated   --set-env-vars SUPABASE_URL=...,SUPABASE_ANON_KEY=...,SUPABASE_SERVICE_ROLE_KEY=...

## 4) Test
- Website: https://<service-url>/
- API:     https://<service-url>/api/auth-login

## 5) Connect your domain (Squarespace DNS)
In Google Cloud Console:
- Cloud Run -> your service -> Custom Domains (Domain mapping)
Google will show DNS records to add.
In Squarespace DNS settings, add the exact CNAME/A records Google provides.
