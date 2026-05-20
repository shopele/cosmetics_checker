const RULES = {
  cosmetic: {
    label: '化粧品',
    law: '薬機法第61条',
    items: [
      {
        id: 'cs_01',
        name: '製品名（名称）',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第1号',
        reason: '製品の識別に必要な法定表示事項です。',
        law_reference: '薬機法第61条第1号',
        suggestion: '製品名を容器・外箱に明記してください。例: 「○○クリーム」'
      },
      {
        id: 'cs_02',
        name: '製造販売業者の名称・住所',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第2号',
        reason: '消費者が問合せ・苦情を申し出る先として必要な法定表示事項です。',
        law_reference: '薬機法第61条第2号',
        suggestion: '製造販売業者の正式名称と住所（都道府県以上）を容器・外箱に明記してください。'
      },
      {
        id: 'cs_03',
        name: '製造番号または製造記号',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第3号',
        reason: '製品の製造ロットを特定するために必要な法定表示事項です。回収対応等に不可欠です。',
        law_reference: '薬機法第61条第3号',
        suggestion: 'ロット番号や製造記号（例: LOT12345）を容器・外箱に刻印または印字してください。'
      },
      {
        id: 'cs_04',
        name: '内容量（重量・容量）',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第4号',
        reason: '消費者が製品量を把握するために必要な法定表示事項です。',
        law_reference: '薬機法第61条第4号',
        suggestion: '内容量を重量（g）または容量（mL）で数値と単位を明記してください。例: 「50g」「100mL」'
      },
      {
        id: 'cs_05',
        name: '全成分の名称',
        required: true,
        requiredType: 'mandatory',
        article: '化粧品全成分表示通知（平成13年厚生労働省通知）',
        reason: '消費者がアレルギー成分を確認できるよう、全成分の開示が義務付けられています。',
        law_reference: '平成13年厚生労働省通知（化粧品全成分表示）',
        suggestion: '配合されている全成分を日本語成分名（INCI準拠）でリストアップし、容器・外箱に表示してください。'
      },
      {
        id: 'cs_06',
        name: '使用期限（製造後3年以内に変質する製品）',
        required: false,
        requiredType: 'conditional',
        article: '第61条第5号',
        reason: '製造後3年以内に品質が変化する製品は、安全のため使用期限の表示が必要です。',
        law_reference: '薬機法第61条第5号',
        suggestion: '使用期限を「2026年12月」または「製造後2年」のように明記してください。'
      },
      {
        id: 'cs_07',
        name: '使用上の注意（特定成分を含む場合）',
        required: false,
        requiredType: 'conditional',
        article: '第61条第6号',
        reason: '特定成分（旧表示指定成分等）を含む場合、消費者保護のために使用上の注意が必要です。',
        law_reference: '薬機法第61条第6号',
        suggestion: '「目に入った場合はすぐ洗い流してください」等、具体的な使用上の注意を明記してください。'
      }
    ]
  },
  quasi_drug: {
    label: '医薬部外品',
    law: '薬機法第59条',
    items: [
      {
        id: 'qd_01',
        name: '製品名（名称）',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第1号',
        reason: '製品の識別に必要な法定表示事項です。',
        law_reference: '薬機法第59条第1号',
        suggestion: '製品名を容器・外箱に明記してください。承認を受けた名称と一致させてください。'
      },
      {
        id: 'qd_02',
        name: '「医薬部外品」の文字',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第2号',
        reason: '医薬部外品であることを消費者に明示するために必須の法定表示です。',
        law_reference: '薬機法第59条第2号',
        suggestion: '「医薬部外品」の文字を容器・外箱に明示してください。省略や略記は認められません。'
      },
      {
        id: 'qd_03',
        name: '製造販売業者の名称・住所',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第3号',
        reason: '消費者が問合せ・苦情を申し出る先として必要な法定表示事項です。',
        law_reference: '薬機法第59条第3号',
        suggestion: '製造販売業者の正式名称と住所（都道府県以上）を容器・外箱に明記してください。'
      },
      {
        id: 'qd_04',
        name: '製造番号または製造記号',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第4号',
        reason: '製品の製造ロットを特定するために必要な法定表示事項です。回収対応等に不可欠です。',
        law_reference: '薬機法第59条第4号',
        suggestion: 'ロット番号や製造記号（例: LOT12345）を容器・外箱に刻印または印字してください。'
      },
      {
        id: 'qd_05',
        name: '内容量（重量・容量）',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第5号',
        reason: '消費者が製品量を把握するために必要な法定表示事項です。',
        law_reference: '薬機法第59条第5号',
        suggestion: '内容量を重量（g）または容量（mL）で数値と単位を明記してください。例: 「50g」「100mL」'
      },
      {
        id: 'qd_06',
        name: '有効成分の名称・分量',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第6号',
        reason: '医薬部外品の効能効果を発揮する有効成分の開示は、安全確保と承認内容の遵守のために必須です。',
        law_reference: '薬機法第59条第6号',
        suggestion: '承認を受けた有効成分の名称と配合量（分量）を明記してください。例: 「有効成分: 塩化ベンザルコニウム 0.05%」'
      },
      {
        id: 'qd_07',
        name: '全成分（添加物）の名称',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第7号',
        reason: '消費者がアレルギー成分を確認できるよう、添加物の開示が義務付けられています。',
        law_reference: '薬機法第59条第7号',
        suggestion: '有効成分以外の添加物を全てリストアップし、容器・外箱に表示してください。'
      },
      {
        id: 'qd_08',
        name: '効能・効果',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第8号',
        reason: '医薬部外品は承認された効能効果のみを表示しなければなりません。',
        law_reference: '薬機法第59条第8号',
        suggestion: '承認書に記載された効能効果の文言をそのまま表示してください。独自の改変は認められません。'
      },
      {
        id: 'qd_09',
        name: '用法・用量',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第9号',
        reason: '安全な使用方法を消費者に伝えるために必要な法定表示事項です。',
        law_reference: '薬機法第59条第9号',
        suggestion: '承認された用法・用量を正確に表示してください。例: 「1日3回、適量を患部に塗布」'
      },
      {
        id: 'qd_10',
        name: '使用上の注意',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第10号',
        reason: '副作用・過敏症等のリスクから消費者を守るために必要な法定表示事項です。',
        law_reference: '薬機法第59条第10号',
        suggestion: '「してはいけないこと」「相談すること」「その他の注意」等の使用上の注意を承認書に従い明記してください。'
      }
    ]
  }
};

const NG_EXPRESSION_CATEGORIES = [
  {
    id: 'ng_01',
    name: '効能効果の標榜',
    description: '医薬品的な効能効果を暗示・標榜する表現',
    examples: ['シミが消える', '育毛', '育毛促進', 'アトピー', '湿疹に効く'],
    suggestion: '「整える」「ケアする」「うるおいを与える」など、化粧品の効能効果の範囲内の表現に言い換えてください。'
  },
  {
    id: 'ng_02',
    name: '絶対的表現',
    description: '最大級・絶対的な効果を主張する表現',
    examples: ['世界一', '完全に', '必ず', '絶対'],
    suggestion: '断定的・最大級の表現を避け、「○○をサポートする」「うるおいを保つ」などの穏やかな表現に変更してください。'
  },
  {
    id: 'ng_03',
    name: '医療機関・専門家による推薦の偽装',
    description: '医師・専門家が推薦するかのような誇大表現',
    examples: ['皮膚科医推薦', '医師が認めた'],
    suggestion: '具体的な推薦事実がある場合は正確な出典を記載し、ない場合は削除してください。'
  },
  {
    id: 'ng_04',
    name: '未承認の効能効果（医薬部外品のみ）',
    description: '承認を受けていない効能効果の表示',
    examples: [],
    suggestion: '承認された効能効果のみを表示し、未承認の表現は削除してください。'
  }
];
