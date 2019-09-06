# Circuit Integration Final
Js Classes for the integration of DialogFlow Bot on Chat Platform https://circuit.com

## Deploy to Google Cloud
**Prerequisites:**
gcloud account with billing enabled

### Deploy
* Create gcloud project and enable the Cloud Functions API and a dialogFlow project related to it
* Clone this repo on gconsole
* Into project root:
    * Change projectId and session variables with yours:
        * const projectId = '$projectId';
        * const sessionId = '$projectId-session-id';
* Authorize gcloud to access the Cloud Platform via: gcloud auth login
* Set the project via: gcloud config set project $projectName
* Setup a service account for authenticating the cloud APIs https://cloud.google.com/docs/authentication/getting-started
* Create a circuit sandbox account at: https://circuitsandbox.net and create a bot at circuit menu: 
   * Manage Applications >> Custom Applications >> Create >> Bot
* Rename .env.yaml.template to .env.yaml and update it with your credentials configuration from circuit bot
* Deploy the Datastore indexes on root via: 
   * gcloud app deploy index.yaml
* Deploy the functions via: 
   * cd manage;
     * gcloud beta functions deploy start --runtime nodejs8 --env-vars-file ../.env.yaml --trigger-http
     * gcloud beta functions deploy stop --runtime nodejs8 --env-vars-file ../.env.yaml --trigger-http
   * cd ../
   * cd webhook;
     * gcloud beta functions deploy webhook --runtime nodejs8 --env-vars-file ../.env.yaml --trigger-http
* Run the activators:
  *  https://$regionLang-$projectName.cloudfunctions.net/start
  *  https://$regionLang-$projectName.cloudfunctions.net/webhook
