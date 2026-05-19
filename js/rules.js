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
        article: '第61条第1号'
      },
      {
        id: 'cs_02',
        name: '製造販売業者の名称・住所',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第2号'
      },
      {
        id: 'cs_03',
        name: '製造番号または製造記号',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第3号'
      },
      {
        id: 'cs_04',
        name: '内容量（重量・容量）',
        required: true,
        requiredType: 'mandatory',
        article: '第61条第4号'
      },
      {
        id: 'cs_05',
        name: '全成分の名称',
        required: true,
        requiredType: 'mandatory',
        article: '化粧品全成分表示通知（平成13年厚生労働省通知）'
      },
      {
        id: 'cs_06',
        name: '使用期限（製造後3年以内に変質する製品）',
        required: false,
        requiredType: 'conditional',
        article: '第61条第5号'
      },
      {
        id: 'cs_07',
        name: '使用上の注意（特定成分を含む場合）',
        required: false,
        requiredType: 'conditional',
        article: '第61条第6号'
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
        article: '第59条第1号'
      },
      {
        id: 'qd_02',
        name: '「医薬部外品」の文字',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第2号'
      },
      {
        id: 'qd_03',
        name: '製造販売業者の名称・住所',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第3号'
      },
      {
        id: 'qd_04',
        name: '製造番号または製造記号',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第4号'
      },
      {
        id: 'qd_05',
        name: '内容量（重量・容量）',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第5号'
      },
      {
        id: 'qd_06',
        name: '有効成分の名称・分量',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第6号'
      },
      {
        id: 'qd_07',
        name: '全成分（添加物）の名称',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第7号'
      },
      {
        id: 'qd_08',
        name: '効能・効果',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第8号'
      },
      {
        id: 'qd_09',
        name: '用法・用量',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第9号'
      },
      {
        id: 'qd_10',
        name: '使用上の注意',
        required: true,
        requiredType: 'mandatory',
        article: '第59条第10号'
      }
    ]
  }
};

const NG_EXPRESSION_CATEGORIES = [
  { id: 'ng_01', name: '効能効果の標榜', description: '医薬品的な効能効果を暗示・標榜する表現', examples: ['シミが消える', '育毛', '育毛促進', 'アトピー', '湿疹に効く'] },
  { id: 'ng_02', name: '絶対的表現', description: '最大級・絶対的な効果を主張する表現', examples: ['世界一', '完全に', '必ず', '絶対'] },
  { id: 'ng_03', name: '医療機関・専門家による推薦の偽装', description: '医師・専門家が推薦するかのような誇大表現', examples: ['皮膚科医推薦', '医師が認めた'] },
  { id: 'ng_04', name: '未承認の効能効果（医薬部外品のみ）', description: '承認を受けていない効能効果の表示', examples: [] }
];
