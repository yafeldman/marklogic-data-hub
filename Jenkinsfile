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

def runCypressE2e(){
    script{
        copyRPM 'Release','10.0-6'
        setUpML '$WORKSPACE/xdmp/src/Mark*.rpm'
        sh 'rm -rf *central*.rpm || true'
        copyArtifacts filter: '**/*.rpm', fingerprintArtifacts: true, flatten: true, projectName: '${JOB_NAME}', selector: specific('${BUILD_NUMBER}')
        sh(script:'''#!/bin/bash
            export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;
            sudo mladmin install-hubcentral $WORKSPACE/*central*.rpm;
            sudo mladmin add-javahome-hubcentral $JAVA_HOME
            sudo mladmin start-hubcentral
        ''')
        sh(script:'''#!/bin/bash
            export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;
            export M2_LOCAL_REPO=$WORKSPACE/$M2_HOME_REPO
            export GRADLE_USER_HOME=$WORKSPACE$GRADLE_DIR;
            export PATH=$M2_LOCAL_REPO:$JAVA_HOME/bin:$GRADLE_USER_HOME:$PATH;
            rm -rf $M2_LOCAL_REPO || true
            mkdir -p $M2_LOCAL_REPO
            cd $WORKSPACE/data-hub;
            ./gradlew publishToMavenLocal -Dmaven.repo.local=$M2_LOCAL_REPO -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/
            '''
        )
        sh(script:'''
          #!/bin/bash
          export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;
          export GRADLE_USER_HOME=$WORKSPACE$GRADLE_DIR;
          export M2_LOCAL_REPO=$WORKSPACE/$M2_HOME_REPO
          export PATH=$M2_LOCAL_REPO:$JAVA_HOME/bin:$GRADLE_USER_HOME:$PATH;
          cd $WORKSPACE/data-hub;
          rm -rf $GRADLE_USER_HOME/caches;
          cd marklogic-data-hub-central/ui/e2e;
          repo="maven {url '"$M2_LOCAL_REPO"'}"
          sed -i "/repositories {/a$repo" hc-qa-project/build.gradle
          chmod +x setup.sh;
          ./setup.sh dhs=false mlHost=localhost mlSecurityUsername=admin mlSecurityPassword=admin;
          '''
        )
        sh(script:'''#!/bin/bash
            export NODE_HOME=$NODE_HOME_DIR/bin;
            export PATH=$NODE_HOME:$PATH
            cd $WORKSPACE/data-hub/marklogic-data-hub-central/ui/e2e
            npm run cy:run |& tee -a e2e_err.log;
        '''
        )

        def output=readFile 'data-hub/marklogic-data-hub-central/ui/e2e/e2e_err.log'
        if(output.contains("npm ERR!")){
           // currentBuild.result='UNSTABLE';
        }

        junit '**/e2e/**/*.xml'
    }
}

void UnitTest(){
        props = readProperties file:'data-hub/pipeline.properties';
        copyRPM 'Release','10.0-6'
        setUpML '$WORKSPACE/xdmp/src/Mark*.rpm'
        sh 'export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;export GRADLE_USER_HOME=$WORKSPACE$GRADLE_DIR;export M2_HOME=$MAVEN_HOME/bin;export PATH=$JAVA_HOME/bin:$GRADLE_USER_HOME:$PATH:$MAVEN_HOME/bin;cd $WORKSPACE/data-hub;rm -rf $GRADLE_USER_HOME/caches;set +e;./gradlew clean;./gradlew marklogic-data-hub:bootstrap -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/;sleep 10s;./gradlew marklogic-data-hub-central:test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/;sleep 10s;./gradlew ml-data-hub:test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/;sleep 10s;./gradlew marklogic-data-hub-spark-connector:test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/;sleep 10s;./gradlew installer-for-dhs:test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/;sleep 10s;./gradlew marklogic-data-hub-client-jar:test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/'
        junit '**/TEST-*.xml'
        jacoco classPattern: 'data-hub/marklogic-data-hub-central/build/classes/java/main/com/marklogic/hub/central,data-hub/marklogic-data-hub-spark-connector/build/classes/java/main/com/marklogic/hub/spark,data-hub/marklogic-data-hub/build/classes/java/main/com/marklogic/hub',exclusionPattern: '**/*Test*.class'
        if(env.CHANGE_TITLE){
            JIRA_ID=env.CHANGE_TITLE.split(':')[0]
            jiraAddComment comment: 'Jenkins Unit Test Results For PR Available', idOrKey: JIRA_ID, site: 'JIRA'
        }
        if(!env.CHANGE_URL){
            env.CHANGE_URL=" "
        }
}

void myabortPrevBuilds(){
    def hi = Hudson.instance
    def pname = env.JOB_NAME.split('/')[0]

    hi.getItem(pname).getItem(env.JOB_BASE_NAME).getBuilds().getRawBuild().each{ build ->

        def exec = build.getExecutor()

        def parameters = build.getAllActions().find{it instanceof ParametersAction }?.params

        println " BUILD number: " + build.number + " " + parameters

        if (build.number < currentBuild.number && build.isBuilding() && exec != null) {
            exec.interrupt(
                Result.ABORTED,
                new CauseOfInterruption.UserInterruption(
                    "Aborted by #${currentBuild.number}"
                )
            )
            println("Aborted previous running build #${build.number}")
        } else {
            println("Build is not running or is current build, not aborting - #${build.number}")
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
    booleanParam(name: 'DEBUG_BUILD', defaultValue: true, description: '')
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
