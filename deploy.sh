echo "Deploying Data Toolbox (incl. updated DT Base)..."
export XP_HOME=$XP_HOME_DATATOOLBOX
mvn clean install -q && cd ../data-toolbox-app && ./gradlew clean deploy -q
echo "Data Toolbox (incl. updated DT Base) deployed"