const axios = require("axios");
const fs = require("fs");
const data = JSON.parse(
  fs.readFileSync(".github/data/project_board.json", "utf8"),
);

const headers = {
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

const owner = "LuminLynx";
const repo = "foss-dictionary";

async function createColumn(projectId, columnName) {
  const res = await axios.post(
    `https://api.github.com/projects/${projectId}/columns`,
    {
      name: columnName,
    },
    { headers },
  );
  return res.data.id;
}

async function createCard(columnId, note) {
  await axios.post(
    `https://api.github.com/projects/columns/${columnId}/cards`,
    {
      note,
    },
    { headers },
  );
}

(async () => {
  const projectRes = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/projects`,
    {
      name: data.name,
      body: data.body,
    },
    { headers },
  );
  const projectId = projectRes.data.id;

  for (const col of data.columns) {
    const columnId = await createColumn(projectId, col.name);
    for (const card of col.cards) {
      await createCard(columnId, card.note);
    }
  }

  // in your script file
  console.error("Failed to connect to GitHub API");
})();
