import type { GetStaticPathsResult, GetStaticProps } from "next";
import Head from "next/head";

import allRealms from "../../../../../static/realms.json";
import { getAllProfessionsByLocale, retrieveToken } from "../../../../bnet/api";
import type { RealmMeta } from "../../../../bnet/realms";
import type { BattleNetRegion } from "../../../../client/context/AuthContext/types";

type ProfessionProps = {
  region: BattleNetRegion;
  profession: string;
  realm: Omit<RealmMeta, "_links">;
};

// eslint-disable-next-line import/no-default-export
export default function Profession({
  profession,
  realm,
  region,
}: ProfessionProps): JSX.Element {
  return (
    <>
      <Head>
        <title>
          {profession} / {region}-{realm.name}
        </title>
      </Head>
      <h1>
        {region} - {realm.name} - {profession}
      </h1>
    </>
  );
}

export const getStaticPaths = async (): Promise<
  GetStaticPathsResult<{ region: string; realm: string; profession: string }>
> => {
  const flatRealms = allRealms.map((realm) => ({
    realm: realm.slug,
    region: realm.region.slug as BattleNetRegion,
  }));

  const token = await retrieveToken();
  const professionData = await getAllProfessionsByLocale("en_US", token);
  const professionNames = professionData.professions.map((profession) =>
    profession.name.toLocaleLowerCase().split(" ").join("-")
  );

  const paths = flatRealms.flatMap(({ realm, region }) => {
    return professionNames.map((profession) => ({
      params: {
        profession,
        realm,
        region,
      },
    }));
  });

  return {
    fallback: "blocking",
    paths,
  };
};

// @ts-expect-error TODO
export const getStaticProps: GetStaticProps<ProfessionProps> = async (ctx) => {
  if (
    !ctx.params?.region ||
    Array.isArray(ctx.params.region) ||
    !ctx.params.realm ||
    Array.isArray(ctx.params.realm) ||
    !ctx.params.profession ||
    Array.isArray(ctx.params.profession)
  ) {
    throw new Error("incorrect getStaticProps");
  }

  const { region, realm, profession } = ctx.params as {
    region: BattleNetRegion;
    realm: string;
    profession: string;
  };

  const realmData = allRealms.find(
    (maybeRealm) =>
      maybeRealm.slug === realm && maybeRealm.region.slug === region
  );

  if (!realmData) {
    throw new Error(`unknown realm ${region}-${realm}`);
  }

  return {
    props: {
      profession: profession.charAt(0).toUpperCase() + profession.slice(1),
      realm: realmData,
      region: region.toUpperCase() as BattleNetRegion,
    },
  };
};
