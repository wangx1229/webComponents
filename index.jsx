import React, { useState, useCallback } from 'react';
import fetchAPI from 'utils/fetch';
import { debounce } from 'lodash';
import config from 'config';
import { tools, JSBridge } from '@iyunbao/utils';
import { Confirm } from 'zarm';

import { Toast } from 'components/common';
import {
  useFee,
  useData,
  useZizhi,
  useWechatBind,
} from './hook/index.js';
import {
  Dialog,
  AuthDialog,
} from './components/index.js';
import {
  TAB,
  TEXT,
  formatValue,
  formatAmount,
} from './const.js';
import './index.scss';

function Home({ router }) {
  const [active, setActive] = useState(3);
  const [wxBindVisible, setWxBindVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [accept, setAccept] = useState(true);
  const [calVisible, setCalVisible] = useState(false);
  const [calContent, setCalContent] = useState();
  const [value, setValue] = useState('');
  const data = useData()[active];
  const zizhi = useZizhi();
  const fee = useFee()[active];
  const [bindStatus, redirectUrl] = useWechatBind();
  const [errorTip, setErrorTip] = useState('');

  const checkValidValue = useCallback((val, max) => {
    // 未输入提现金额
    if (val === '') {
      return '请输入提现金额';
    }

    if (+val <= 0) {
      return '请输入正确的提现金额';
    }

    // 需要手续费时
    if (+fee.fee > 0 && +val <= 3) {
      return `提现金额需大于手续费${fee.fee}元`;
    }

    // 输入提现金额过大
    if (+val > max) {
      return '超过最大金额';
    }

    return '';
  }, [fee]);

  const delayFetch = useCallback(debounce(async (channelCode, val) => {
    // 延迟请求时 'xx.' 去掉 '.'
    const temp = val.split('.');
    const [int, dec] = temp;
    const amount = (dec === '' || dec === undefined) ? int : val;

    const inValidMessage = checkValidValue(amount, data.maximumWithdrawAmount);

    setErrorTip(inValidMessage);

    if (inValidMessage) {
      setCalContent();
    } else {
      const { result, code, message } = await fetchAPI.post({
        path: '/qybcapital/auth/v4/accountMerge/withdraw/getAccountRouter',
        server: 'api',
        data: {
          channelCode,
          amount,
          initCache: data.initCache,
        },
      });

      if (+code === 0) {
        setCalContent(result);
      } else {
        Toast.warning(message);
      }
    }
    setCalVisible(false);
  }, 600), [data, checkValidValue]);

  const handleChange = (paramActive, paramValue) => {
    // 预处理 禁止输入非数字内容 保留 'xx.xx'值返回
    const val = formatValue(paramValue);
    setValue(val);

    delayFetch(paramActive, val);
  };

  const handleSubmit = () => {
    if (!accept) {
      Toast.error('请选择同意协议');
      return;
    }

    if (!zizhi) {
      setAuthVisible(true);
      return;
    }

    if (calContent) {
      setDialogVisible(true);
    }
  };

  if (!data) {
    return null;
  }

  return (
    <main className="page-withDraw">
      <header className="page-withDraw-tab">
        {
          TAB.map(item => (
            <div
              className="page-withDraw-tab-item"
              key={item.code}
              onClick={() => {
                if (item.code !== active) {
                  // 未进行微信绑定
                  if (item.code === 2 && bindStatus === 1) {
                    setWxBindVisible(true);
                    return;
                  }
                  setCalVisible(false);
                  setCalContent();
                  setValue('');
                  setActive(item.code);
                }
              }}
            >
              <p className={active === item.code ? 'active' : ''}>
                {item.text}
                {item.code === 2 && <span>免手续费</span>}
              </p>
            </div>
          ))
        }
      </header>

      <section className="page-withDraw-cash">
        <div className="page-withDraw-cash-card">
          <div className="name">
            <img className="name-icon" src={data.iconUrl} alt="icon" />
            <p>{data.withdrawAccountName}</p>
          </div>

          <p className="label">提现金额</p>

          <div className="amount">
            <span>¥</span>
            <div className="current">
              <input
                type="text"
                placeholder="请输入金额"
                value={value}
                onChange={e => handleChange(active, e.target.value)}
              />
              <div
                className="btn"
                onClick={() => {
                  handleChange(active, formatAmount(data.maximumWithdrawAmount));
                }}
              >全部提现
              </div>
            </div>
          </div>

          <p className="tip">当前余额{formatAmount(data.balance)}元，本次单笔最多可提现{formatAmount(data.maximumWithdrawAmount)}元</p>
          {active === 3 && <p className="fee-tip">每月免费提现次数<span className="special">{fee.freeCount}</span>次，剩余<span className="special">{fee.leftCount}</span>次</p>}
          {(active === 2 && data.groupAmount > 0) && <p className="warn">注：其中{data.groupAmount}元，仅支持提现至银行卡</p>}
          {value !== undefined && <p className="warn">{errorTip}</p>}
        </div>

        {
          (calContent && calContent.withdrawList.length > 1) && (
            <div className="page-withDraw-cash-cal">
              <div
                className="head"
                onClick={() => setCalVisible(prev => !prev)}
              >
                智能提现，为你匹配单次最大额度
                <img
                  className={`show-icon${calVisible ? ' rotate' : ''}`}
                  src="https://static.iyb.tm/web/h5/h5/my/wealth/withdraw/show.png"
                  alt="show"
                />
              </div>
              {
                calVisible && (
                  <div className="body">
                    <p>您将收到如下账户的付款，总计{value}元：</p>
                    {calContent.withdrawList.map((item, index) => <p key={index}>{TEXT[index]}：{item.amount}元</p>)}
                  </div>
                )
              }
            </div>
          )
        }
      </section>

      <div
        className={`page-withDraw-btn${calContent !== undefined ? ' active' : ''}`}
        onClick={handleSubmit}
      >提现
      </div>

      <div
        className="page-withDraw-item"
        onClick={() => {
          setAccept(prev => !prev);
        }}
      >
        <img src={`https://static.iyb.tm/web/h5/h5/my/wealth/withdraw/${accept ? 'accept' : 'default'}.png`} alt="icon" />
        <div className="text">
          我已阅读并同意
          <a href="https://cdn.iyb.tm/app/config/img/74122.pdf">《个人所得税扣缴申报管理办法（试行）》</a>
          <a href="https://static.iyb.tm/web/h5/h5/my/wealth/withdraw/74123.pdf">《平台服务协议》</a>
        </div>
      </div>

      <div className="page-withDraw-rule">
        <span onClick={() => router.push({
          pathname: '/m/my/wealth/new_withdraw/rule',
        })}
        >提现规则
        </span>
      </div>

      <div className="page-withDraw-tel" >
        <div
          onClick={() => {
            window.location.href = 'tel://400-050-5079';
          }}
        >客服电话：400-050-5079
        </div>
      </div>

      {(dialogVisible && calContent !== undefined) && (
        <Dialog
          onClose={setDialogVisible}
          dataSource={{
            value,
            code: active,
            tradeNo: calContent.tradeNo,
            fee: fee.fee,
          }}
        />
      )}

      {
        authVisible && (
          <AuthDialog
            setVisible={setAuthVisible}
          />
        )
      }

      <Confirm
        shape="radius"
        visible={wxBindVisible}
        okText="立即绑定"
        cancelText="取消"
        message="您尚未绑定微信。请先完成微信绑定后进行提现。"
        onOk={() => {
          if (tools.isInApp) {
            JSBridge.go(redirectUrl);
          } else {
            window.location.href = `${config.URL.passport}/m/auth/agent/appConnectWechat`;
          }
        }}
        onCancel={() => setWxBindVisible(false)}
      />
    </main>
  );
}

export default Home;
