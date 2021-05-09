echo "Deploying Data Toolbox (incl. updated DT Base)..."
export XP_HOME=$XP_HOME_DATATOOLBOX
export PATH=/usr/local/bin:$PATH
mvn clean install -q && cd ../data-toolbox-app && ./gradlew clean deploy -q
echo "Data Toolbox (incl. updated DT Base) deployed"