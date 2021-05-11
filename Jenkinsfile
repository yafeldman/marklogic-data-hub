@Library('shared-libraries') _
JIRA_ID="";
def props;
def dhfWinTests(String mlVersion, String type){
    copyMSI type,mlVersion;
    def pkgOutput=bat(returnStdout:true , script: '''
	                    cd xdmp/src
	                    for /f "delims=" %%a in ('dir /s /b *.msi') do set "name=%%~a"
	                    echo %name%
	                    ''').trim().split();
	def pkgLoc=pkgOutput[pkgOutput.size()-1]
	gitCheckout 'ml-builds','https://github.com/marklogic/MarkLogic-Builds','master'
	def bldOutput=bat(returnStdout:true , script: '''
        	           cd ml-builds/scripts/lib/
        	           CD
        	        ''').trim().split();
    def bldPath=bldOutput[bldOutput.size()-1]
    setupMLWinCluster bldPath,pkgLoc
    bat 'cd data-hub & gradlew.bat -g ./cache-build clean'
    bat 'cd data-hub & gradlew.bat marklogic-data-hub:test  || exit /b 0'
    //bat 'cd data-hub & gradlew.bat ml-data-hub:test  || exit /b 0'
    //bat 'cd data-hub & gradlew.bat web:test || exit /b 0'
    junit '**/TEST-*.xml'
         //jiraAddComment comment: 'Jenkins rh7_cluster_9.0-Nightly Test Results For PR Available', idOrKey: JIRA_ID, site: 'JIRA'
}

pipeline{
	agent none;
	options {
  	checkoutToSubdirectory 'data-hub'
  	skipStagesAfterUnstable()
  	buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '30', numToKeepStr: '')
	}
	environment{
	JAVA_HOME_DIR="~/java/jdk1.8.0_72"
	GRADLE_DIR="/.gradle"
	MAVEN_HOME="/usr/local/maven"
	DMC_USER     = credentials('MLBUILD_USER')
    DMC_PASSWORD= credentials('MLBUILD_PASSWORD')
	}
	parameters{
	string(name: 'Email', defaultValue: 'stadikon@marklogic.com,kkanthet@marklogic.com,sbalasub@marklogic.com,nshrivas@marklogic.com,ssambasu@marklogic.com,rrudin@marklogic.com,rdew@marklogic.com,aebadira@marklogic.com,mwooldri@marklogic.com', description: 'Who should I say send the email to?')
	}
	stages{
		stage('Build-datahub'){
		agent { label 'dhfLinuxAgent'}
			steps{
                cleanWs deleteDirs: true, patterns: [[pattern: 'data-hub/**', type: 'EXCLUDE']]
                script{
        props = readProperties file:'data-hub/pipeline.properties';
				if(env.CHANGE_TITLE){
				JIRA_ID=env.CHANGE_TITLE.split(':')[0];
				def transitionInput =[transition: [id: '41']]
				//jiraTransitionIssue idOrKey: JIRA_ID, input: transitionInput, site: 'JIRA'
				}
				}
				println(BRANCH_NAME)
				sh 'export JAVA_HOME=`eval echo "$JAVA_HOME_DIR"`;export GRADLE_USER_HOME=$WORKSPACE$GRADLE_DIR;export M2_HOME=$MAVEN_HOME/bin;export PATH=$GRADLE_USER_HOME:$PATH:$MAVEN_HOME/bin;cd $WORKSPACE/data-hub;rm -rf $GRADLE_USER_HOME/caches;./gradlew clean --stacktrace;./gradlew build -x test;'
				archiveArtifacts artifacts: 'data-hub/marklogic-data-hub/build/libs/* , data-hub/ml-data-hub-plugin/build/libs/* , data-hub/web/build/libs/*', onlyIfSuccessful: true			}
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
                      sendMail email,'Check the Pipeline View Here: ${JENKINS_URL}/blue/organizations/jenkins/Datahub_CI/detail/${JOB_BASE_NAME}/${BUILD_ID}  \n\n\n Check Console Output Here: ${BUILD_URL}/console \n\n\n Pipeline Failed at the stage while building datahub. Please fix the issues',false,'Data Hub Build for $BRANCH_NAME Failed'
                      }
                  }
                  }
		}

		stage('w12_SN_9.0-11'){
			agent { label 'dhfWinagent'}
			steps{timeout(time: 3,  unit: 'HOURS'){
                catchError(buildResult: 'SUCCESS', catchInterruptions: true, stageResult: 'FAILURE'){
                    cleanWs deleteDirs: true, patterns: [[pattern: 'data-hub/**', type: 'EXCLUDE']]
                    dhfWinTests("9.0-11","Release")
                }
            }}
			post{
                 success {
                    println("w12_SN_9.0-11 Tests Completed")
                    sendMail Email,'Check the Pipeline View Here: ${JENKINS_URL}/blue/organizations/jenkins/Datahub_CI/detail/$JOB_BASE_NAME/$BUILD_ID  \n\n\n Check Console Output Here: ${BUILD_URL}/console \n\n\n All the End to End tests on W2k12 SN 9.0-12 of the branch $BRANCH_NAME passed and the next stage is to merge it to release branch if all the end-end tests pass',false,'w12_SN_9.0-12 Tests for $BRANCH_NAME Passed'
                   }
                   unstable {
                      println("w12_SN_9.0-11 Tests Failed")
                      sendMail Email,'Check the Pipeline View Here: ${JENKINS_URL}/blue/organizations/jenkins/Datahub_CI/detail/$JOB_BASE_NAME/$BUILD_ID  \n\n\n Check Console Output Here: ${BUILD_URL}/console \n\n\n Some of the End to End tests of the branch $BRANCH_NAME on 9.0-12 w2k12 SN failed. Please fix the tests and create a PR or create a bug for the failures.',false,'w12_SN_9.0-12 Tests for $BRANCH_NAME Failed'
                  }
                  }
		}
    }
}
