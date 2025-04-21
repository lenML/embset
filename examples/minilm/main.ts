import { EmbSet, SimpleDB, EmbedModel, Vector } from "../../src/main";
import {
  FeatureExtractionPipeline,
  pipeline,
  env,
} from "@huggingface/transformers";

env.allowLocalModels = true;
env.allowRemoteModels = true;

class MiniLMEmbed implements EmbedModel<string> {
  _instance: Promise<FeatureExtractionPipeline>;

  constructor() {
    this._instance = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "fp32",
      cache_dir: "./.cache",
      // local_files_only: true,
    }) as any;
  }

  ready() {
    return this._instance.then(() => void 0);
  }

  async embeds(inputs: string[]): Promise<Vector[]> {
    const pipeline = await this._instance;
    const result = await pipeline(inputs, {
      pooling: "mean",
      normalize: true,
    });
    return result.tolist() as Vector[];
  }
}

const test = async () => {
  console.time("test");
  const model = new MiniLMEmbed();
  const set1 = new EmbSet<string, string>({
    db: new SimpleDB(),
    model,
  });
  await model.ready();
  const inputs = [
    "白宫紧急设组应对对华关税危机",
    "白宫慌了！紧急处理对华关税危机",
    "特朗普暗示：不再提高对华关税",
    "莫迪与马斯克通话讨论印美科技合作",
    "乌克兰制裁三家中国企业",
    "泽连斯基首次公开指责中国军援俄罗斯",
    "全球首场人机马拉松北京亦庄开跑",
    "北京举办人机共跑马拉松",
  ];
  await set1.adds(inputs.map((value) => ({ value, metadata: value })));
  const results = await set1.search("北京马拉松");
  console.log(results.map((x) => [x.metadata, x.score]));
  console.timeEnd("test");
};

test();
