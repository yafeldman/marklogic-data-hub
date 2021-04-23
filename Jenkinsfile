@Library('shared-libraries') _

void CoreRh8Tests(String type,String mlVersion){
        copyRPM type,mlVersion
        setUpML '$WORKSPACE/xdmp/src/Mark*.rpm'
        sh '''
export JAVA_HOME=$JAVA_HOME_DIR
export PATH=$JAVA_HOME/bin:$PATH
./gradlew -g ./cache-build clean -i bootstrap test

'''
        junit '**/TEST-*.xml'
}

void BuildDatahub(){
    script{
        props = readProperties file:'data-hub/pipeline.properties';
        if(env.CHANGE_TITLE){
            JIRA_ID=env.CHANGE_TITLE.split(':')[0];
            def transitionInput =[transition: [id: '41']]
            //jiraTransitionIssue idOrKey: JIRA_ID, input: transitionInput, site: 'JIRA'
        }
    }
    println(BRANCH_NAME)
    sh 'export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;export GRADLE_USER_HOME=$WORKSPACE$GRADLE_DIR;export M2_HOME=$MAVEN_HOME/bin;export PATH=$JAVA_HOME/bin:$GRADLE_USER_HOME:$PATH:$MAVEN_HOME/bin;cd $WORKSPACE/data-hub;rm -rf $GRADLE_USER_HOME/caches;./gradlew clean;./gradlew build -x test -i --stacktrace -PnodeDistributionBaseUrl=http://node-mirror.eng.marklogic.com:8080/ --parallel;'
    archiveArtifacts artifacts: 'data-hub/marklogic-data-hub/build/libs/* , data-hub/ml-data-hub-plugin/build/libs/* , data-hub/web/build/libs/* , data-hub/marklogic-data-hub-central/build/libs/* , data-hub/marklogic-data-hub-central/build/**/*.rpm , data-hub/marklogic-data-hub-spark-connector/build/libs/*', onlyIfSuccessful: true

}

pipeline{
	agent none;
	options {
  	checkoutToSubdirectory 'data-hub'
  	buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '30', numToKeepStr: '')
	}
	environment{
	JAVA_HOME_DIR="/home/builder/java/openjdk-1.8.0-161"
	}
	parameters{
	string(name: 'Email', defaultValue: 'yakov.feldman@marklogic.com' ,description: 'Who should I say send the email to?')
	}

    stages {
		stage('Build-datahub'){
            agent { label 'dhfLinuxAgent'}
			steps{BuildDatahub()}
				post{
                   failure {
                      println("Datahub Build FAILED")
                      script{
                      def email;
                    if(env.CHANGE_AUTHOR){
                    	def author=env.CHANGE_AUTHOR.toString().trim().toLowerCase()
                    	 email=getEmailFromGITUser author
                    }else{
                    email=Email
                    }
                     sendMail email,'<h3>Pipeline Failed at the stage while building datahub. Please fix the issues</h3><h4><a href=${RUN_DISPLAY_URL}>Check the Pipeline View</a></h4><h4> <a href=${BUILD_URL}/console> Check Console Output Here</a></h4>',false,'Data Hub Build for $BRANCH_NAME Failed'
                      }
                  }
                  }
		}

        stage('rh8 core latest java'){
          agent { label 'dhfLinuxAgent'}
          environment{
             JAVA_HOME_DIR="/home/$USER/java/jdk-16.0.1"
             JAVA_HOME="$JAVA_HOME_DIR"
             PATH="$JAVA_HOME/bin:$PATH"
          }
          steps {
              timeout(time: 3,  unit: 'HOURS'){
              catchError(buildResult: 'SUCCESS', catchInterruptions: true) { CoreRh8Tests("Latest", "10.0") }
           }}
         post{
            success {
               println("$STAGE_NAME Completed")
               sendMail Email,"<h3>$STAGE_NAME Server on Linux Platform</h3><h4><a href=${RUN_DISPLAY_URL}>Check the Pipeline View</a></h4><h4> <a href=${BUILD_URL}/console> Check Console Output Here</a></h4>",false,"$BRANCH_NAME on $STAGE_NAME | Passed"
            }
            unstable {
              println("$STAGE_NAME Failed")
             sendMail Email,"<h3>$STAGE_NAME Server on Linux Platform </h3><h4><a href=${JENKINS_URL}/blue/organizations/jenkins/Datahub_CI/detail/$JOB_BASE_NAME/$BUILD_ID/tests><font color=red>Check the Test Report</font></a></h4><h4><a href=${RUN_DISPLAY_URL}>Check the Pipeline View</a></h4><h4> <a href=${BUILD_URL}/console> Check Console Output Here</a></h4><h4>Please create bugs for the failed regressions and fix them</h4>",false,"$BRANCH_NAME on $STAGE_NAME Failed"
          }}
        }
}}
