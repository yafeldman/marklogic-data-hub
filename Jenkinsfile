@Library('shared-libraries') _
import groovy.json.JsonSlurper
import groovy.json.JsonSlurperClassic
import org.jenkinsci.plugins.workflow.steps.FlowInterruptedException
JIRA_ID="";
commitMessage="";
def prResponse="";
def prNumber;
def props;
githubAPIUrl="https://api.github.com/repos/marklogic/marklogic-data-hub"
def loadProperties() {
    node {
        checkout scm
        properties = new Properties()
        props.load(propertiesFile.newDataInputStream())
        echo "Immediate one ${properties.repo}"
    }
}
def getReviewState(){
    def  reviewResponse;
    def commitHash;
    withCredentials([usernameColonPassword(credentialsId: '550650ab-ee92-4d31-a3f4-91a11d5388a3', variable: 'Credentials')]) {
       reviewResponse = sh (returnStdout: true, script:'''
                            curl -u $Credentials  -X GET  '''+githubAPIUrl+'''/pulls/$CHANGE_ID/reviews
                           ''')
       commitHash = sh (returnStdout: true, script:'''
                         curl -u $Credentials  -X GET  '''+githubAPIUrl+'''/pulls/$CHANGE_ID
                       ''')
    }
    def jsonObj = new JsonSlurperClassic().parseText(commitHash.toString().trim())
    def commit_id=jsonObj.head.sha
    println(commit_id)
    def reviewState=getReviewStateOfPR reviewResponse,2,commit_id ;
    return reviewState
}
def PRDraftCheck(){
    def type;
    withCredentials([usernameColonPassword(credentialsId: '550650ab-ee92-4d31-a3f4-91a11d5388a3', variable: 'Credentials')]) {
        PrObj= sh (returnStdout: true, script:'''
                   curl -u $Credentials  -X GET  '''+githubAPIUrl+'''/pulls/$CHANGE_ID
                   ''')
    }
    def jsonObj = new JsonSlurperClassic().parseText(PrObj.toString().trim())
    return jsonObj.draft
}

void myabortPrevBuilds(){
    def hi = Hudson.instance
    def pname = env.JOB_NAME.split('/')[0]

    hi.getItem(pname).getItem(env.JOB_BASE_NAME).getBuilds().each{ build ->

        def exec = build.getExecutor()
        Boolean regressions = build.getAllActions().find{it instanceof ParametersAction }?.parameters.find{it.name == 'regressions'}

         println " BUILD number: " + build.number + " " + regressions.booleanValue()

        if ( (regressions != null && regressions.booleanValue()) &&
               build.number < currentBuild.number &&
                 exec != null )
        {
            exec.interrupt(
                Result.ABORTED,
                new CauseOfInterruption.UserInterruption(
                    "Aborted by #${currentBuild.number}"
                )
            )
            println("Aborted previous running build #${build.number}")
        } else {
            println("Build is regressions or not running or is current build, not aborting - #${build.number}")
        }
    }
}

void PreBuildCheck() {

// def obj=new abortPrevBuilds();
 myabortPrevBuilds();

}


pipeline{
	agent none;
	options {
  	checkoutToSubdirectory 'data-hub'
  	buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '30', numToKeepStr: '')
	}
	environment{
	JAVA_HOME_DIR="/home/builder/java/openjdk-1.8.0-262"
	GRADLE_DIR="/.gradle"
	MAVEN_HOME="/usr/local/maven"
	M2_HOME_REPO="/repository"
	NODE_HOME_DIR="/home/builder/nodeJs/node-v12.18.3-linux-x64"
	DMC_USER     = credentials('MLBUILD_USER')
    DMC_PASSWORD= credentials('MLBUILD_PASSWORD')
	}
	parameters{
	string(name: 'Email', defaultValue: 'yakov.feldman@marklogic.com' ,description: 'Who should I say send the email to?')
    booleanParam(name: 'regressions', defaultValue: false, description: 'indicator if build is for regressions')
	}
	stages{
	    stage('Pre-Build-Check'){
	    agent { label 'stress-pool'}
//        agent { label 'dhfLinuxAgent'}
            steps{ PreBuildCheck() }
	    post{
	        failure{
	            script{
                 def email;
                 if(env.CHANGE_AUTHOR){
                   def author=env.CHANGE_AUTHOR.toString().trim().toLowerCase()
                   email=getEmailFromGITUser author
                  }else{ email=Email  }

                 sendMail email,'<h3>Pipeline Failed possibly because there is no JIRA ID. Please add JIRA ID to the <a href=${CHANGE_URL}>PR Title</a></h3><h4><a href=${RUN_DISPLAY_URL}>Check the Pipeline View</a></h4><h4> <a href=${BUILD_URL}/console> Check Console Output Here</a></h4>',false,'NO JIRA ID for $BRANCH_NAME | pipeline Failed  '
	            }
	        }
	    }
	    }

            }
}
