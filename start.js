const chalk = require("chalk");
const clear = require("clear");
const figlet = require("figlet");
const inquirer = require("./lib/inquirer");
const { _get, _post } = require("./utils/http");

(async () => {
  clear();

  console.log(
    chalk.yellow(figlet.textSync("ETNA Flemme", { horizontalLayout: "full" }))
  );

  const credentials = await inquirer.askQuestions();

  const responseIdentify = await _post(
    "https://auth.etna-alternance.net/identity",
    {
      login: credentials.username,
      password: credentials.password,
    }
  );

  const data = responseIdentify.headers["set-cookie"];
  const token = data.split(";")[0].split("=")[1];

  const responseCurrentActivities = await _get(
    "https://modules-api.etna-alternance.net/students/hanry_p/currentactivities",
    token
  );

  const module = credentials.module ? credentials.module : "TIC-DAT3";

  const moduleId = responseCurrentActivities.data[module].quest[0].module_id;
  const moduleName = responseCurrentActivities.data[module].quest[0].name;

  const responseDateDeclare = await _get(
    "https://gsa-api.etna-alternance.net/students/hanry_p/logs",
    token
  );

  const messagePerso = credentials.messagePersonnalise
    ? credentials.messagePersonnalise
    : `J'ai travaille sur le module ${moduleName} aujourd'hui. Le projet avance bien.`;

  const declaredDate = responseDateDeclare.data.contracts[0].schedules;
  for (let index = 0; index < declaredDate.length; index++) {
    const element = declaredDate[index];
    await _post(
      "https://intra-api.etna-alternance.net/modules/8859/declareLogs",
      {
        module: moduleId,
        declaration: {
          start: element.start,
          end: element.end,
          content: `Objectifs :\\n${messagePerso}\\nActions :\\n${messagePerso}\\nRésultats :\\n${messagePerso} \\nDifficultés rencontrées :\\n /`,
        },
        sosJawa: false,
      },
      token
    );
  }
  console.log(chalk.redBright("Bien jouer tu as gagne 10m de ta vie"));
})();
