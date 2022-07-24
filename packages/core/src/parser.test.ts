import { parameters } from "./parser";

describe("parser", () => {
  describe("parse", () => {
    it("should find no param with empty query", async () => {
      expect(parameters(``)).toStrictEqual({ named: [], positional: [] });
    });

    it("should ignore sharp commented ?", async () => {
      expect(parameters(`#?`)).toStrictEqual({ named: [], positional: [] });
    });

    it("should ignore dash commented ?", async () => {
      expect(parameters(`--?`)).toStrictEqual({ named: [], positional: [] });
    });

    it("should ignore multiline commented ?", async () => {
      expect(parameters(`/*?*/`)).toStrictEqual({
        named: [],
        positional: [],
      });
    });

    it("should find positional param with question", async () => {
      expect(parameters(`?`)).toStrictEqual({
        named: [],
        positional: [
          {
            type: "positional",
            token: "?",
            index: 0,
            range: {
              start: {
                line: 0,
                character: 0,
              },
              end: {
                line: 0,
                character: 1,
              },
            },
          },
        ],
      });
    });

    it("should find positional param with line break and question", async () => {
      expect(
        parameters(`
?`)
      ).toStrictEqual({
        named: [],
        positional: [
          {
            type: "positional",
            token: "?",
            index: 0,
            range: {
              start: {
                line: 1,
                character: 0,
              },
              end: {
                line: 1,
                character: 1,
              },
            },
          },
        ],
      });
    });

    it("should find positional param with line break (\r\n) and question", async () => {
      expect(parameters(`\r\n?`)).toStrictEqual({
        named: [],
        positional: [
          {
            type: "positional",
            token: "?",
            index: 0,
            range: {
              start: {
                line: 1,
                character: 0,
              },
              end: {
                line: 1,
                character: 1,
              },
            },
          },
        ],
      });
    });

    it("should find positional params from complex query", () => {
      expect(
        parameters(`SELECT
    word,
    word_count
FROM 
    \`bigquery-public-data.samples.shakespeare\`
WHERE
    corpus = ?
    AND word_count >= ?
ORDER BY
    word_count DESC
`)
      ).toStrictEqual({
        named: [],
        positional: [
          {
            type: "positional",
            token: "?",
            index: 0,
            range: {
              start: {
                line: 6,
                character: 13,
              },
              end: {
                line: 6,
                character: 14,
              },
            },
          },
          {
            type: "positional",
            token: "?",
            index: 1,
            range: {
              start: {
                line: 7,
                character: 22,
              },
              end: {
                line: 7,
                character: 23,
              },
            },
          },
        ],
      });
    });

    it("should find positional params from complex query with comment", () => {
      expect(
        parameters(`SELECT
    corpus,
    word,
    # @foo,
    # @bar # -- @baz */ @qux,
    word_count
    -- @bar # @baz -- @foo #-- @qux
FROM 
    \`bigquery-public-data.samples.shakespeare\`
WHERE
    corpus = ?/* @foo -- @bar          -- "romeoandjuliet"
    @baz # /* @qux
    @foo
        @foo@bar    */AND word_count >= ? -- 250
ORDER BY
    word_count DESC
`)
      ).toStrictEqual({
        named: [],
        positional: [
          {
            type: "positional",
            token: "?",
            index: 0,
            range: {
              start: {
                line: 10,
                character: 13,
              },
              end: {
                line: 10,
                character: 14,
              },
            },
          },
          {
            type: "positional",
            token: "?",
            index: 1,
            range: {
              start: {
                line: 13,
                character: 40,
              },
              end: {
                line: 13,
                character: 41,
              },
            },
          },
        ],
      });
    });

    it("should ignore sharp commented @", async () => {
      expect(parameters(`#@foo`)).toStrictEqual({ named: [], positional: [] });
    });

    it("should ignore dash commented @", async () => {
      expect(parameters(`--@foo`)).toStrictEqual({
        named: [],
        positional: [],
      });
    });

    it("should ignore multiline commented @", async () => {
      expect(parameters(`/*\n@foo\n*/`)).toStrictEqual({
        named: [],
        positional: [],
      });
    });

    it("should find named param with @", async () => {
      expect(parameters(`@`)).toStrictEqual({
        named: [
          {
            type: "named",
            token: "@",
            name: "",
            ranges: [
              {
                start: {
                  line: 0,
                  character: 0,
                },
                end: {
                  line: 0,
                  character: 1,
                },
              },
            ],
          },
        ],
        positional: [],
      });
    });

    it("should find named param with line break and @", async () => {
      expect(
        parameters(`
@`)
      ).toStrictEqual({
        named: [
          {
            type: "named",
            token: "@",
            name: "",
            ranges: [
              {
                start: {
                  line: 1,
                  character: 0,
                },
                end: {
                  line: 1,
                  character: 1,
                },
              },
            ],
          },
        ],
        positional: [],
      });
    });

    it("should find named params from complex query", () => {
      expect(
        parameters(`SELECT
    word,
    word_count
FROM
    \`bigquery-public-data.samples.shakespeare\`
WHERE
    corpus = @corpus
    AND word_count >= @min_word_count
ORDER BY
    word_count DESC
`)
      ).toStrictEqual({
        named: [
          {
            type: "named",
            token: "@corpus",
            name: "corpus",
            ranges: [
              {
                start: {
                  line: 6,
                  character: 13,
                },
                end: {
                  line: 6,
                  character: 20,
                },
              },
            ],
          },
          {
            type: "named",
            token: "@min_word_count",
            name: "min_word_count",
            ranges: [
              {
                start: {
                  line: 7,
                  character: 22,
                },
                end: {
                  line: 7,
                  character: 37,
                },
              },
            ],
          },
        ],
        positional: [],
      });
    });

    it("should find same named params once", () => {
      expect(
        parameters(`SELECT
    word,
    word_count
FROM
    \`bigquery-public-data.samples.shakespeare\`
WHERE
    corpus = @corpus
    AND word_count >= @min_word_count
    AND word_count < @min_word_count + 100
ORDER BY
    word_count DESC
`)
      ).toStrictEqual({
        named: [
          {
            type: "named",
            token: "@corpus",
            name: "corpus",
            ranges: [
              {
                start: {
                  line: 6,
                  character: 13,
                },
                end: {
                  line: 6,
                  character: 20,
                },
              },
            ],
          },
          {
            type: "named",
            token: "@min_word_count",
            name: "min_word_count",
            ranges: [
              {
                start: {
                  line: 7,
                  character: 22,
                },
                end: {
                  line: 7,
                  character: 37,
                },
              },
              {
                start: {
                  line: 8,
                  character: 21,
                },
                end: {
                  line: 8,
                  character: 36,
                },
              },
            ],
          },
        ],
        positional: [],
      });
    });

    it("should find named params from complex query with comment", () => {
      expect(
        parameters(`SELECT
    corpus,
    word,
    # @foo,
    # @bar # -- @baz */ @qux,
    word_count
    -- @bar # @baz -- @foo #-- @qux
FROM
    \`bigquery-public-data.samples.shakespeare\`
WHERE
    corpus = @corpus/* @foo -- @bar                   -- "romeoandjuliet" 
    @baz # /* @qux
    @foo
        @foo@bar    */AND word_count >= @min_word_count   -- 250
ORDER BY
    word_count DESC
`)
      ).toStrictEqual({
        named: [
          {
            type: "named",
            token: "@corpus",
            name: "corpus",
            ranges: [
              {
                start: {
                  line: 10,
                  character: 13,
                },
                end: {
                  line: 10,
                  character: 20,
                },
              },
            ],
          },
          {
            type: "named",
            token: "@min_word_count",
            name: "min_word_count",
            ranges: [
              {
                start: {
                  line: 13,
                  character: 40,
                },
                end: {
                  line: 13,
                  character: 55,
                },
              },
            ],
          },
        ],
        positional: [],
      });
    });
  });
});
