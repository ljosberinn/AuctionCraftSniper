import type { NextApiRequest } from "next";
import nextConnect from "next-connect";

import type { SimpleProfession } from "../../../../../../static/professions";
import { simpleProfessions } from "../../../../../../static/professions";
import { simpleRealms } from "../../../../../../static/realms";
import {
  allCraftedItemIds,
  allReagentIds,
  recipeMap,
} from "../../../../../../static/recipes";
import { isBattleNetRegion, retrieveToken } from "../../../../../bnet/api";
import type {
  Auction,
  AuctionPartial,
  OuterAuctionData,
} from "../../../../../bnet/recipes";
import type { BattleNetRegion } from "../../../../../client/context/AuthContext/types";
import type { RequestHandler } from "../../../../../server/auth/types";
import { BAD_REQUEST } from "../../../../../utils/statusCodes";

const allCraftedItemIdsSet = new Set(allCraftedItemIds);
const allReagentIdSet = new Set(allReagentIds);

const determineCurrentProfessions = (maybeProfessions?: string | string[]) => {
  if (!maybeProfessions) {
    return simpleProfessions;
  }

  const probablyProfessions = Array.isArray(maybeProfessions)
    ? maybeProfessions
    : maybeProfessions.split(",");

  const mostLikelyProfessions = simpleProfessions.filter((profession) =>
    probablyProfessions.includes(profession.slug)
  );

  return mostLikelyProfessions.length > 0
    ? mostLikelyProfessions
    : simpleProfessions;
};

const getParams = ({
  query: { realm, region, professions: maybeProfessions },
}: NextApiRequest) => {
  if (!realm || !region || Array.isArray(realm) || Array.isArray(region)) {
    return {
      professions: null,
      realm: null,
      region: null,
    };
  }

  if (!isBattleNetRegion(region)) {
    return {
      professions: null,
      realm: null,
      region: null,
    };
  }

  const realmData = simpleRealms.find(
    (data) => data.region === region && data.slug === realm
  );

  if (!realmData) {
    return {
      professions: null,
      realm: null,
      region: null,
    };
  }

  const professions = determineCurrentProfessions(maybeProfessions);

  return {
    professions,
    realm: realmData,
    region,
  };
};

const getAuctionHouseData = async (
  id: number,
  region: BattleNetRegion,
  access_token: string
): Promise<OuterAuctionData> => {
  const params = new URLSearchParams({
    access_token,
    locale: "en_US",
    namespace: `dynamic-${region}`,
    region,
  }).toString();

  const baseUrl = `https://${region}.api.blizzard.com/data/wow/connected-realm/${id}/auctions`;
  const url = `${baseUrl}?${params}`;

  const response = await fetch(url);
  return response.json();
};

const trimAuctionData = (auctions: Auction[]): AuctionPartial[] =>
  auctions.map((auction) => ({
    bid: auction.bid,
    buyout: auction.buyout,
    id: auction.id,
    item: auction.item,
    quantity: auction.quantity,
  }));

const selectAuctions = (
  auctions: AuctionPartial[],
  selectedProfessions: SimpleProfession[]
): AuctionPartial[] => {
  const relevantAuctions = auctions.filter(
    (auction) =>
      !allReagentIdSet.has(auction.item.id) ||
      !allCraftedItemIdsSet.has(auction.item.id)
  );

  const demandedIds = new Set(
    selectedProfessions.reduce<number[]>((carry, profession) => {
      // TODO: remove once all professions are actually available
      if (recipeMap[profession.id]) {
        const ids = recipeMap[profession.id].map((recipe) => recipe.id);

        return [...carry, ...ids];
      }

      return carry;
    }, [])
  );

  return relevantAuctions.filter((auction) => demandedIds.has(auction.item.id));
};

const handler: RequestHandler<AuctionPartial[]> = async (req, res) => {
  const { realm, region, professions } = getParams(req);

  if (!realm || !region || !professions) {
    res.status(BAD_REQUEST).end();
    return;
  }

  try {
    const token = await retrieveToken();
    const { auctions } = await getAuctionHouseData(
      realm.connectedRealmId,
      region,
      token
    );

    const selectedAuctions = selectAuctions(
      trimAuctionData(auctions),
      professions
    );

    res.json(selectedAuctions);
  } catch {
    res.json([]);
  }
};

// eslint-disable-next-line import/no-default-export
export default nextConnect().get(handler);
