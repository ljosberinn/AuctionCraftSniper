import type { GetStaticPaths, GetStaticProps } from "next";

import {
  getAllRealmsByRegion,
  getRealmDataByName,
  regions,
  retrieveToken,
} from "../../../bnet/api";
import type { RealmMeta } from "../../../bnet/realms";
import type { BattleNetRegion } from "../../../client/context/AuthContext/types";

type RealmProps = {
  region: BattleNetRegion;
  realm: Omit<RealmMeta, "_links">;
};

// eslint-disable-next-line import/no-default-export
export default function Realm({ region, realm }: RealmProps): JSX.Element {
  return (
    <h1>
      {region} - {realm.name}
    </h1>
  );
}

export const getStaticPaths: GetStaticPaths<{
  region: BattleNetRegion;
  realm: string;
}> = async () => {
  const token = await retrieveToken();
  const allRealms = await Promise.all(
    regions.map(async (region) => ({
      realms: await getAllRealmsByRegion(region, token),
      region,
    }))
  );

  const paths = allRealms.flatMap((data) =>
    data.realms.map((realm) => ({
      params: {
        realm: realm.slug,
        region: data.region,
      },
    }))
  );

  return {
    fallback: false,
    paths,
  };
};

export const getStaticProps: GetStaticProps<RealmProps> = async (ctx) => {
  if (
    !ctx.params?.region ||
    Array.isArray(ctx.params.region) ||
    !ctx.params.realm ||
    Array.isArray(ctx.params.realm)
  ) {
    throw new Error("incorrect getStaticProps");
  }

  const { region, realm } = ctx.params as {
    region: BattleNetRegion;
    realm: string;
  };

  const token = await retrieveToken();
  const realmData = await getRealmDataByName(realm, region, token);

  return {
    props: { realm: realmData, region },
  };
};
