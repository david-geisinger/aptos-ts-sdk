// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import {
  AccountAddress,
  objectStructTag,
  optionStructTag,
  stringStructTag,
  StructTag,
  TypeTag,
  TypeTagAddress,
  TypeTagBool,
  TypeTagSigner,
  TypeTagStruct,
  TypeTagU128,
  TypeTagU16,
  TypeTagU256,
  TypeTagU32,
  TypeTagU64,
  TypeTagU8,
  TypeTagVector,
} from "../../src";
import { Identifier } from "../../src/transactions/instances";
import { parseTypeTag, TypeTagParserError, TypeTagParserErrorType } from "../../src/transactions/typeTag/parser";

const MODULE_NAME = new Identifier("tag");
const STRUCT_NAME = new Identifier("Tag");

const structTagType = (typeTags?: Array<TypeTag>) =>
  new TypeTagStruct(new StructTag(AccountAddress.ONE, MODULE_NAME, STRUCT_NAME, typeTags ?? []));

const typeTagParserError = (str: string, errorType: TypeTagParserErrorType, subStr?: string) => {
  expect(() => parseTypeTag(str)).toThrow(new TypeTagParserError(subStr ?? str, errorType));
};

describe("TypeTagParser", () => {
  test("invalid types", () => {
    // Missing 8
    typeTagParserError("8", TypeTagParserErrorType.InvalidTypeTag);

    // Addr isn't a type
    typeTagParserError("addr", TypeTagParserErrorType.InvalidTypeTag);

    // No references
    typeTagParserError("&address", TypeTagParserErrorType.InvalidTypeTag);

    // Standalone generic
    typeTagParserError("T1", TypeTagParserErrorType.InvalidTypeTag);

    // Not enough colons
    typeTagParserError("0x1:tag::Tag", TypeTagParserErrorType.UnexpectedStructFormat);
    typeTagParserError("0x1::tag:Tag", TypeTagParserErrorType.UnexpectedStructFormat);

    // Invalid inner type
    typeTagParserError("0x1::tag::Tag<8>", TypeTagParserErrorType.InvalidTypeTag, "8");

    // Invalid address
    // TODO: We may want to consider a more friendly address message
    expect(() => parseTypeTag("1::tag::Tag")).toThrow("Hex string must start with a leading 0x.");
    expect(() => parseTypeTag("1::tag::Tag<u8>")).toThrow("Hex string must start with a leading 0x.");

    // Invalid spacing around type arguments
    typeTagParserError("0x1::tag::Tag <u8>", TypeTagParserErrorType.UnexpectedWhitespaceCharacter);

    // Invalid type argument combinations
    typeTagParserError("0x1::tag::Tag<<u8>", TypeTagParserErrorType.MissingTypeArgumentClose);
    typeTagParserError("0x1::tag::Tag<<u8 u8>", TypeTagParserErrorType.UnexpectedWhitespaceCharacter);
    typeTagParserError("0x1::tag::Tag<u8>>", TypeTagParserErrorType.UnexpectedTypeArgumentClose);

    // Comma separated arguments not in type arguments
    typeTagParserError("u8, u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("u8,u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("u8 ,u8", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8>,0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8>, 0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8> ,0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);
    typeTagParserError("0x1::tag::Tag<u8> , 0x1::tag::Tag", TypeTagParserErrorType.UnexpectedComma);

    typeTagParserError("0x1::tag::Tag<u8<u8>>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");

    // TODO: These errors are not clear
    typeTagParserError("0x1::tag::Tag<u8><u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");
    typeTagParserError("0x1<u8>::tag::Tag<u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");
    typeTagParserError("0x1::tag<u8>::Tag<u8>", TypeTagParserErrorType.UnexpectedPrimitiveTypeArguments, "u8");

    // Invalid type tags without arguments
    // TODO: Message could be clearer
    typeTagParserError("0x1::tag::Tag<>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<,>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<, >", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag< ,>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag< , >", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<u8,>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<>>>", TypeTagParserErrorType.TypeArgumentCountMismatch);
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<u8,>>>", TypeTagParserErrorType.TypeArgumentCountMismatch);

    // TODO: This should have a better message
    typeTagParserError("0x1::tag::Tag<0x1::tag::Tag<,u8>>>", TypeTagParserErrorType.UnexpectedTypeArgumentClose);

    // TODO: This case isn't caught
    // typeTagParserError("0x1::tag::Tag<,u8>", TypeTagParserErrorType.TypeArgumentCountMismatch);
  });

  test("standard types", () => {
    expect(parseTypeTag("signer")).toEqual(new TypeTagSigner());
    // Technically this isn't a specific type tag, but this is a good estimation of it
    expect(parseTypeTag("&signer")).toEqual(new TypeTagSigner());
    expect(parseTypeTag("u8")).toEqual(new TypeTagU8());
    expect(parseTypeTag("u16")).toEqual(new TypeTagU16());
    expect(parseTypeTag("u32")).toEqual(new TypeTagU32());
    expect(parseTypeTag("u64")).toEqual(new TypeTagU64());
    expect(parseTypeTag("u128")).toEqual(new TypeTagU128());
    expect(parseTypeTag("u256")).toEqual(new TypeTagU256());
    expect(parseTypeTag("bool")).toEqual(new TypeTagBool());
    expect(parseTypeTag("address")).toEqual(new TypeTagAddress());
  });

  test("outside spacing", () => {
    expect(parseTypeTag(" address")).toEqual(new TypeTagAddress());
    expect(parseTypeTag("address ")).toEqual(new TypeTagAddress());
    expect(parseTypeTag(" address ")).toEqual(new TypeTagAddress());
  });

  test("vector", () => {
    expect(parseTypeTag("vector<u8>")).toEqual(new TypeTagVector(new TypeTagU8()));
    expect(parseTypeTag("vector<u16>")).toEqual(new TypeTagVector(new TypeTagU16()));
    expect(parseTypeTag("vector<u32>")).toEqual(new TypeTagVector(new TypeTagU32()));
    expect(parseTypeTag("vector<u64>")).toEqual(new TypeTagVector(new TypeTagU64()));
    expect(parseTypeTag("vector<u128>")).toEqual(new TypeTagVector(new TypeTagU128()));
    expect(parseTypeTag("vector<u256>")).toEqual(new TypeTagVector(new TypeTagU256()));
    expect(parseTypeTag("vector<bool>")).toEqual(new TypeTagVector(new TypeTagBool()));
    expect(parseTypeTag("vector<address>")).toEqual(new TypeTagVector(new TypeTagAddress()));
    expect(parseTypeTag("vector<0x1::string::String>")).toEqual(
      new TypeTagVector(new TypeTagStruct(stringStructTag())),
    );
  });

  test("nested vector", () => {
    expect(parseTypeTag("vector<vector<u8>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU8())));
    expect(parseTypeTag("vector<vector<u16>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU16())));
    expect(parseTypeTag("vector<vector<u32>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU32())));
    expect(parseTypeTag("vector<vector<u64>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU64())));
    expect(parseTypeTag("vector<vector<u128>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU128())));
    expect(parseTypeTag("vector<vector<u256>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagU256())));
    expect(parseTypeTag("vector<vector<bool>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagBool())));
    expect(parseTypeTag("vector<vector<address>>")).toEqual(new TypeTagVector(new TypeTagVector(new TypeTagAddress())));
    expect(parseTypeTag("vector<vector<0x1::string::String>>")).toEqual(
      new TypeTagVector(new TypeTagVector(new TypeTagStruct(stringStructTag()))),
    );
  });

  test("string", () => {
    expect(parseTypeTag("0x1::string::String")).toEqual(new TypeTagStruct(stringStructTag()));
  });

  test("object", () => {
    expect(parseTypeTag("0x1::object::Object<0x1::tag::Tag>")).toEqual(
      new TypeTagStruct(objectStructTag(structTagType())),
    );
    expect(parseTypeTag("0x1::object::Object<0x1::tag::Tag<u8>>")).toEqual(
      new TypeTagStruct(objectStructTag(structTagType([new TypeTagU8()]))),
    );
  });

  test("option", () => {
    expect(parseTypeTag("0x1::option::Option<0x1::tag::Tag>")).toEqual(
      new TypeTagStruct(optionStructTag(structTagType())),
    );
    expect(parseTypeTag("0x1::option::Option<0x1::tag::Tag<u8>>")).toEqual(
      new TypeTagStruct(optionStructTag(structTagType([new TypeTagU8()]))),
    );
  });

  test("0x1::tag::Tag", () => {
    expect(parseTypeTag("0x1::tag::Tag")).toEqual(structTagType());
  });

  test("0x1::tag::Tag<u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8>")).toEqual(structTagType([new TypeTagU8()]));
  });

  test("0x1::tag::Tag<u8,u64>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,u64>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU64()]));
  });

  test("0x1::tag::Tag<u8,  u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,  u8>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<  u8,u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<  u8,u8>")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<u8,u8  >", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8,u8  >")).toEqual(structTagType([new TypeTagU8(), new TypeTagU8()]));
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8>>")).toEqual(structTagType([structTagType([new TypeTagU8()])]));
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8, u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8, u8>>")).toEqual(
      structTagType([structTagType([new TypeTagU8(), new TypeTagU8()])]),
    );
  });

  test("0x1::tag::Tag<u8, 0x1::tag::Tag<u8>>", () => {
    expect(parseTypeTag("0x1::tag::Tag<u8, 0x1::tag::Tag<u8>>")).toEqual(
      structTagType([new TypeTagU8(), structTagType([new TypeTagU8()])]),
    );
  });

  test("0x1::tag::Tag<0x1::tag::Tag<u8>, u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<u8>, u8>")).toEqual(
      structTagType([structTagType([new TypeTagU8()]), new TypeTagU8()]),
    );
  });

  test("0x1::tag::Tag<0x1::tag::Tag<0x1::tag::Tag<u8>>, u8>", () => {
    expect(parseTypeTag("0x1::tag::Tag<0x1::tag::Tag<0x1::tag::Tag<u8>>, u8>")).toEqual(
      structTagType([structTagType([structTagType([new TypeTagU8()])]), new TypeTagU8()]),
    );
  });

  /* These are debatable on whether they are valid or not */
  test.skip("edge case invalid types", () => {
    // TODO: Do we care about this one?

    expect(() => parseTypeTag("0x1::tag::Tag< , u8>")).toThrow();
    expect(() => parseTypeTag("0x1::tag::Tag<,u8>")).toThrow();
  });

  /* These need to be supported for ABI parsing */
  test.skip("struct with generic", () => {
    expect(parseTypeTag("0x1::tag::Tag<T1>")).toEqual(structTagType());
  });
});